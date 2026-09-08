/* =============================================================
   YouTube Chat Dock — pause chat on hover

   Runs INSIDE the chat document only, and is the mirror image of
   dock.js: that file is top-frame-only and bails in iframes,
   this one bails unless the document it is in is /live_chat.

   The guard is on the pathname and deliberately NOT on
   `window !== top`: pop-out chat ("Chat in a new window") is a
   TOP-LEVEL /live_chat page, and requiring a frame would leave
   the feature dead in exactly the view people open to read chat.

   Nothing here is gated on ytchat-enabled. Freezing the list so
   you can read it is chat behaviour, not layout — it is just as
   useful on YouTube's stock sidebar as it is in the dock.
   ============================================================= */
(function () {
  'use strict';

  /* '/live_chat' is a prefix of '/live_chat_replay', so one test covers live
     chat, chat replay and the pop-out window. Same name dock.js keys its
     health tripwire on, and for the same reason: YouTube cannot rename it
     without breaking their own chat. */
  if (location.pathname.indexOf(YTCHAT.SEL.framePath) !== 0) return;

  const SEL = YTCHAT.SEL;
  const KEY = YTCHAT.K.hoverpause;

  /* Enter is long enough that crossing the panel on the way to the player is
     a no-op, short enough that stopping to read never feels gated. Leave is
     generous because a message's own menu, or the user card a click on an
     avatar opens, can fire pointerout on the way — the delay is what stops
     that being read as leaving. */
  const ENTER_MS = 180;
  const LEAVE_MS = 500;

  const TAIL = 24;     // "close enough to the bottom to count as the tail"

  /* Nothing here can tell WHO moved the scroller, so the user's INPUT is what
     is timestamped — wheel, pointerdown (scrollbar and text selection), keys
     — and a movement inside this window is the only kind treated as theirs.
     Everything else is YouTube following the tail. */
  const USER_MS = 400;

  const root = document.documentElement;

  let on = true;
  let zone = false;        // pointer is in the hot zone right now
  let held = false;        // ... and has been long enough to freeze
  let parked = false;      // user is reading history and must stay there
  let startedParked = false;
  let userScrolled = false;
  let enterT = 0;
  let leaveT = 0;
  let lastUserAt = 0;

  const scroller = () => document.querySelector(SEL.chatScroller);
  const showMore = () => document.querySelector(SEL.chatShowMore);

  /* Deliberately NOT "distance from bottom is small". After a quiet hover the
     scrollTop has not moved but new lines have been appended below it, so the
     distance is large even though the user never scrolled. That distinction
     is what userScrolled exists for; this asks the narrower question of
     whether the viewport is currently sitting on the tail. */
  function atBottom(s) {
    return s.scrollHeight - s.scrollTop - s.clientHeight <= TAIL;
  }

  /* ---- the freeze itself ----------------------------------------------

     The obvious implementations were measured on a busy live chat (Kapamilya
     Online Live, ~4 messages per 10s, 1920x769) and both are wrong.

     overflow:hidden is wrong twice over: the user must still be able to
     scroll back through what they stopped to read, and a list YouTube still
     believes is on the tail never renders #show-more, so there would be no
     way back to live either.

     Nudging the scroller a little way off the bottom, so YouTube's own
     at-bottom test detaches follow, is the approach this shipped with first
     and it does not work at the size it needs to be. Measured, each offset
     applied at the tail and then watched for 9s:

       offset  40px   YouTube followed anyway, back to gap 0
       offset  60px   followed
       offset  80px   followed
       offset 100px   followed
       offset 120px   FROZE, gap held at 120
       offset 400px   FROZE, gap held at 400

     So YouTube's tolerance sits between 100 and 120px — about four messages
     — and a nudge big enough to clear it is a visible jump of four messages
     at the exact moment you stopped to read one. The cure is worse than the
     symptom, and tuning to sit just past a threshold this extension cannot
     see was never going to hold.

     Nor is there a zero-jump way to fake the gap: #items is position:absolute
     with a transform inside #item-offset, whose height YouTube writes inline
     and recomputes — measured, padding-bottom on #items moved scrollHeight by
     exactly 0.

     What is left is to let YouTube scroll and put it back, which costs no
     jump at all and needs no number from YouTube. The gap then accumulates on
     its own as messages arrive, and once it passes that ~110px tolerance
     YouTube stops following by itself and this loop goes quiet — so it also
     ends with YouTube genuinely off-bottom, which is what makes the native
     #show-more chip appear rather than being suppressed. */
  let frozenTop = 0;
  let raf = 0;
  /* Resolved at hold() and re-resolved only when it dies, rather than queried
     every frame: the list renderer is replaced whole when chat switches Top
     <-> Live or live <-> replay, and isConnected is what notices that without
     paying for a querySelector 60 times a second. */
  let held$ = null;

  function loop() {
    raf = held ? requestAnimationFrame(loop) : 0;
    if (!held$ || !held$.isConnected) {
      held$ = scroller();
      if (!held$) return;
      frozenTop = held$.scrollTop;   // new list, new baseline
      return;
    }
    const s = held$;
    const st = s.scrollTop;
    if (Date.now() - lastUserAt < USER_MS) {
      // The user's own scrolling. Follow it, and re-baseline onto where they
      // put the list, so the freeze holds their position and not the old one.
      if (st === frozenTop) return;
      frozenTop = st;
      if (atBottom(s)) { userScrolled = false; parked = false; startedParked = false; }
      else userScrolled = true;
    } else if (st > frozenTop) {
      // Only ever undo DOWNWARD movement: that is YouTube following the tail.
      s.scrollTop = frozenTop;
    } else if (st < frozenTop) {
      frozenTop = st;   // something else moved it up; don't fight it
    }
  }

  /* A rAF loop rather than a scroll listener, and the reason is worth
     recording: this runs only between hold() and release(), so it costs one
     property read per frame while the mouse is actually parked on the
     messages and nothing at all the rest of the time. A scroll listener would
     be cheaper still, but it makes the whole feature depend on YouTube's
     follow producing scroll events on #item-scroller, which is one more
     assumption about their internals than this needs. */
  function startLoop() { if (!raf) raf = requestAnimationFrame(loop); }

  function toTail() {
    /* #show-more is YouTube's own "back to live" chip, and clicking it is the
       one jump-to-tail that also clears the chip and re-arms follow.

       Visibility is the test, NOT offsetParent. Measured sitting on the tail:
       the element is a yt-icon-button that stays in layout at 32px high with
       a truthy offsetParent, and is hidden only by visibility:hidden and a
       `disabled` attribute on the <button> inside it. offsetParent would have
       reported the chip as up on every single call. */
    const more = showMore();
    if (more && getComputedStyle(more).visibility !== 'hidden') return void more.click();
    const s = scroller();
    if (s) s.scrollTop = s.scrollHeight;
  }

  function ring(state) {
    if (state) root.setAttribute('data-ytchat-hold', '');
    else root.removeAttribute('data-ytchat-hold');
  }

  function hold() {
    enterT = 0;
    if (!on) return;
    held = true;
    /* Snapshot, because a hover that STARTS in history must not end by
       throwing the user back to live — the peek-resumes rule only applies to
       a hover that started on the tail and never scrolled. */
    startedParked = parked;
    userScrolled = false;
    ring(true);
    held$ = scroller();
    frozenTop = held$ ? held$.scrollTop : 0;
    startLoop();
  }

  function release() {
    leaveT = 0;
    held = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    ring(false);
    if (userScrolled || startedParked) { parked = true; return; }
    parked = false;
    toTail();
  }

  function setZone(v) {
    if (v === zone) {
      /* Same answer as last time, but the enter timer can have been cancelled
         out from under us while `zone` stayed true — and then nothing would
         ever re-arm it, because every later pointerover takes this early
         return. Measured on a chat replay: one blur on the chat window inside
         the 180ms enter delay left hover-pause dead for as long as the
         pointer stayed on the list, and only moving it off the messages and
         back on revived it. Re-arm instead of sitting latched. */
      if (v && !held && !enterT) enterT = setTimeout(hold, ENTER_MS);
      return;
    }
    zone = v;
    if (v) {
      // Re-entering during the leave delay cancels the resume outright.
      clearTimeout(leaveT); leaveT = 0;
      if (!held) enterT = setTimeout(hold, ENTER_MS);
    } else {
      clearTimeout(enterT); enterT = 0;
      if (held && !leaveT) leaveT = setTimeout(release, LEAVE_MS);
    }
  }

  function stop() {
    clearTimeout(enterT); clearTimeout(leaveT);
    enterT = leaveT = 0;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    zone = held = parked = startedParked = userScrolled = false;
    ring(false);
  }

  /* One throw must not take the whole feature with it, and must not spam a
     console 60 times a wheel gesture. Same cap as dock.js. */
  let errorsLogged = 0;
  function safe(fn) {
    return function () {
      try {
        fn.apply(null, arguments);
      } catch (e) {
        if (errorsLogged++ < 3) console.warn('[YouTube Chat Dock]', e);
      }
    };
  }

  const inZone = (n) => !!(n && n.closest && n.closest(SEL.chatList));

  /* pointerover/pointerout rather than pointerenter/leave, and on the
     document rather than on the list: the list renderer is replaced whole
     when chat switches live <-> replay or Top <-> Live, so anything bound to
     it dies silently. These two bubble, so one pair of listeners survives
     every rebuild with no re-binding and no observer.

     Mouse only. Touch already has a pause gesture — scrolling up — and a
     sticky freeze from a tap would be a trap on a device with no hover. */
  document.addEventListener('pointerover', safe((e) => {
    if (e.pointerType !== 'mouse') return;
    setZone(inZone(e.target));
  }), true);

  /* A null relatedTarget is the pointer leaving the document entirely — into
     the parent page, the video, or off the window. Every in-document
     transition is already covered by pointerover above. */
  document.addEventListener('pointerout', safe((e) => {
    if (e.pointerType !== 'mouse' || e.relatedTarget) return;
    setZone(false);
  }), true);

  const markUser = () => { lastUserAt = Date.now(); };
  document.addEventListener('pointerdown', markUser, { capture: true, passive: true });
  document.addEventListener('keydown', markUser, true);

  /* Scrolling up with no hold running still parks the list — the user is
     reading history whether or not they waited out the enter delay, and a
     later hover must not end by throwing them back to live.

     Read off deltaY rather than by measuring the scroller, because at wheel
     time the scroll has not happened yet: scrollTop still reads the old
     value, and the check would be answering the previous frame's question. */
  document.addEventListener('wheel', safe((e) => {
    markUser();
    if (held || e.deltaY >= 0) return;
    parked = true;
  }), { capture: true, passive: true });

  /* The native chip is the parked exit, so honour it rather than compete with
     it: a click clears the parked state and the scroll flag, and a hold that
     is still running simply re-freezes on the new tail. */
  document.addEventListener('click', safe((e) => {
    const n = e.target;
    if (!(n && n.closest && n.closest(SEL.chatShowMore))) return;
    parked = false;
    userScrolled = false;
    startedParked = false;
  }), true);

  /* Losing focus is not the pointer leaving, and resuming on it would scroll
     the list out from under someone who alt-tabbed away mid-read. So this
     cancels the pending RESUME and nothing else.

     It used to clear the enter timer too, which was never needed for that and
     was a real bug: the chat iframe's window takes blur routinely as focus
     moves around the watch page, so a blur landing inside the 180ms enter
     delay threw away the pending hold — and `zone` was still true, so no
     later pointerover could re-arm it. Measured on a live chat replay: hover
     did nothing at all until the pointer left the message list and came back.
     That is the intermittent "the ring shows up but chat keeps scrolling for
     several seconds" this shipped with. */
  const freeze = safe(() => { clearTimeout(leaveT); leaveT = 0; });
  addEventListener('blur', freeze);
  document.addEventListener('visibilitychange', () => { if (document.hidden) freeze(); });

  /* ---- the setting ----------------------------------------------------

     localStorage first because it is synchronous and this document shares
     www.youtube.com's origin with the watch page, so dock.js's mirror has
     already put the popup's value there. chrome.storage.onChanged is what
     makes a toggle apply to an open tab without a reload; both are guarded,
     because a partitioned iframe or an orphaned extension context throws
     rather than returning undefined, and the answer to either is the
     default. */
  try {
    const v = localStorage.getItem(KEY);
    if (v !== null) on = YTCHAT.isOn(v);
  } catch (e) { /* storage disabled or partitioned — default stands */ }

  try {
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, where) => {
        if (where !== 'local' || !(KEY in changes)) return;
        const v = changes[KEY].newValue;
        if (v === undefined) return;
        on = YTCHAT.isOn(v);
        if (!on) safe(stop)();
      });
    }
  } catch (e) { /* orphaned context */ }
})();
