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

     Hold a ROW still, not a scroll offset. That choice is the whole fix, and
     the two versions before it were both wrong in the same way.

     overflow:hidden is wrong twice over: the user must still be able to
     scroll back through what they stopped to read, and a list YouTube still
     believes is on the tail never renders #show-more, so there would be no
     way back to live either.

     Nudging the scroller off the bottom so YouTube's own at-bottom test lets
     go does not work at a usable size. Measured on a busy live chat, each
     offset applied at the tail and watched for 9s: 40, 60, 80 and 100px were
     all followed straight back to gap 0; only 120px and 400px held. YouTube's
     tolerance is therefore around 110px, about four messages, and a nudge big
     enough to clear it is a four-message jump at the exact moment you stopped
     to read one.

     Then this held s.scrollTop at the value it had when the hold started,
     which measured perfectly on a quiet list and fails on the two cases
     actually reported — heavy influx, and hovering in and out repeatedly:

       - The list is VIRTUALISED. #items is position:absolute inside
         #item-offset, whose height YouTube writes inline and recomputes, and
         under heavy influx it also trims old rows off the top. Both renumber
         scrollTop without the content moving, so the old loop's "it went up,
         something else moved it, adopt the new value" branch ratcheted the
         baseline on every trim, and the freeze walked down the list with the
         chat. The more traffic, the more trims, the worse it got.

       - #show-more.click(), which release() uses to jump back to the tail,
         starts YouTube's own smooth scroll (scrollPixelsRemaining_ /
         scrollTimeRemainingMs_ on the list renderer). Re-entering while that
         animation is still in flight made hold() sample scrollTop mid-flight,
         and from there two rAF loops wrote scrollTop every frame, one pulling
         to the tail and one pulling back.

     A row is immune to all of it. "Keep the message under the cursor exactly
     where it is" stays true through appends, trims, offset-height rewrites
     and anyone else's scroll animation, because it is measured against the
     rendered box rather than against a number YouTube is free to renumber. */
  let raf = 0;
  let held$ = null;      // the scroller, resolved at hold()
  let anchor = null;     // the row being held still
  let anchorTop = 0;     // its top, relative to the scroller's top edge

  const offsetOf = (el, s) =>
    el.getBoundingClientRect().top - s.getBoundingClientRect().top;

  /* The topmost row still showing. Deliberately not elementFromPoint: the
     pointer may be over a gap, a menu, or nothing at all, and the anchor has
     to exist whether or not anything is under the cursor. */
  function pickAnchor(s) {
    const items = document.querySelector(SEL.chatItems);
    anchor = null;
    if (!items) return;
    const top = s.getBoundingClientRect().top;
    const kids = items.children;
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].getBoundingClientRect().bottom > top + 1) { anchor = kids[i]; break; }
    }
    if (!anchor && kids.length) anchor = kids[kids.length - 1];
    if (anchor) anchorTop = offsetOf(anchor, s);
  }

  function loop() {
    raf = held ? requestAnimationFrame(loop) : 0;
    if (!held$ || !held$.isConnected) {
      held$ = scroller();
      anchor = null;
      if (!held$) return;
    }
    const s = held$;
    /* Re-picked when the row we were holding is trimmed away, which under
       heavy influx happens to every row eventually. */
    if (!anchor || !anchor.isConnected) return pickAnchor(s);

    const drift = offsetOf(anchor, s) - anchorTop;
    if (!drift) return;

    if (Date.now() - lastUserAt < USER_MS) {
      // The user's own scrolling. Re-anchor onto where they put the list.
      pickAnchor(s);
      if (atBottom(s)) { userScrolled = false; parked = false; startedParked = false; }
      else userScrolled = true;
      return;
    }
    /* Somebody else moved it: YouTube following the tail, a trim, or a scroll
       animation still in flight. Put the row back. Adding the drift rather
       than restoring a remembered scrollTop is what makes this correct when
       the offset container has been renumbered underneath. */
    s.scrollTop += drift;
    /* Clamped at the ends, or fought by an animation mid-frame, the row does
       not land exactly. Take the remainder as the new truth instead of
       re-fighting it forever on the next frame. */
    const left = offsetOf(anchor, s) - anchorTop;
    if (left) anchorTop += left;
  }

  /* A rAF loop rather than a scroll listener, and the reason is worth
     recording: this runs only between hold() and release(), so it costs two
     rects per frame while the mouse is actually parked on the messages and
     nothing at all the rest of the time. A scroll listener would be cheaper
     still, but it makes the whole feature depend on YouTube's follow
     producing scroll events on #item-scroller — measured on a live chat, it
     does not always. */
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
    if (held$) pickAnchor(held$);
    startLoop();
  }

  function release() {
    leaveT = 0;
    held = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    anchor = null;
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
    anchor = null;
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

  /* ---- where the pointer is -------------------------------------------

     Tracked as a COORDINATE and re-tested against the list's box, rather than
     inferred from which element an event happened to land on.

     The event-only version desynced, and hovering in and out repeatedly is
     what exposed it: `zone` is a boolean built from a stream of pointerover /
     pointerout events, and any event that is missed, arrives out of order, or
     arrives for a row YouTube is in the middle of recycling leaves it stuck
     at the wrong value with nothing to correct it. A coordinate tested
     against a rect cannot desync — worst case it is one heartbeat stale.

     Measured on a live chat with the cursor held still: 103 pointerover
     events in 10 seconds, every one of them on a different recycled row. That
     is the churn this has to be indifferent to. */
  let ptrX = -1;
  let ptrY = -1;
  let ptrIn = false;

  function inZoneNow() {
    if (!ptrIn) return false;
    const l = document.querySelector(SEL.chatList);
    if (!l) return false;
    const r = l.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return ptrX >= r.left && ptrX < r.right && ptrY >= r.top && ptrY < r.bottom;
  }

  const track = safe((e) => {
    if (e.pointerType !== 'mouse') return;
    ptrX = e.clientX; ptrY = e.clientY; ptrIn = true;
    setZone(inZoneNow());
  });

  document.addEventListener('pointerover', track, true);
  document.addEventListener('pointermove', track, { capture: true, passive: true });

  /* A null relatedTarget means the pointer left this document — EXCEPT when
     the row it was over was simply removed, which on a fast chat happens
     several times a second. isConnected tells the two apart: a recycled row
     is already detached by the time this fires, a real exit is not. Without
     that test every trim under the cursor read as "the mouse left". */
  document.addEventListener('pointerout', safe((e) => {
    if (e.pointerType !== 'mouse' || e.relatedTarget) return;
    if (e.target && e.target.isConnected === false) return;
    ptrIn = false;
    setZone(false);
  }), true);

  /* The heartbeat that makes the above self-correcting. Everything can be
     missed — events, a relayout, a list rebuilt while the pointer sat still —
     and this re-asks the question from geometry regardless. One querySelector
     and one rect, at a quarter of the rate dock.js already polls the watch
     page. */
  setInterval(safe(() => { if (ptrIn) setZone(inZoneNow()); }), 250);

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
