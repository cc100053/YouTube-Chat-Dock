/* =============================================================
   YouTube Chat Dock — shared settings contract

   Loaded twice, into two different worlds: as the first content
   script (before dock.js, which reads these globals off the
   shared isolated-world scope) and as a plain script in
   popup.html. Both sides therefore agree on key names, defaults
   and bounds by construction rather than by two copies staying
   accidentally in sync.

   Values are stored as STRINGS everywhere, in both
   chrome.storage.local and localStorage. That is not laziness:
   localStorage can only hold strings, and keeping the two
   stores byte-identical makes the mirror in dock.js a literal
   copy with no conversion step to get wrong.
   ============================================================= */
var YTCHAT = {
  MIN: 120,             // narrower than this chat is unreadable, not broken
  MAX: 1100,
  KEEP_FOR_VIDEO: 480,  // never let chat squeeze the player below this
  TOP_GAP: 72,
  STEP: 10,             // popup slider granularity; dragging stays pixel-exact

  /* Key names are unchanged from the versions that predate the popup, so
     widths people already dragged survive the upgrade. */
  K: {
    page: 'ytchat-w',
    fs: 'ytchat-fsw',
    flip: 'ytchat-flip',
    enabled: 'ytchat-enabled',
    divider: 'ytchat-divider',
    tw: 'ytchat-tw',
    theater: 'ytchat-theater',
    lang: 'ytchat-lang',
  },

  DEF: {
    'ytchat-w': '440',
    'ytchat-fsw': '560',
    'ytchat-flip': '0',
    'ytchat-enabled': '1',
    'ytchat-divider': '1',
    /* 450 is YouTube's own theater-mode reservation, measured. Matching it
       means the default layout is exactly what YouTube already made room
       for, and nothing shifts the first time theater is opened. */
    'ytchat-tw': '450',
    'ytchat-theater': '1',
    /* 'auto' means follow the browser. Stored as a literal rather than
       resolved at write time so that changing the browser language keeps
       working for anyone who never touched the picker. */
    'ytchat-lang': 'auto',
  },
};

/* ---- the DOM contract with YouTube ----------------------------------

   Every name this extension borrows from YouTube, in one table, because
   a rename on their side is the single most likely way this breaks and
   the fix should be a diff here rather than a hunt through dock.js.

   Each entry is an ORDERED preference list, most specific first, and
   dock.js walks it with one querySelector per entry. It deliberately does
   NOT pass them as one comma-separated list: a selector list returns the
   first match in DOCUMENT order, not the first selector that matched, so
   a comma list would silently prefer whichever candidate happens to sit
   higher in the tree. That is the opposite of a fallback chain.

   Selectors here are unscoped; dock.js prefixes them with the watch
   element and the mode attributes, so nothing matches outside the player.

   Stability, measured against how YouTube actually churns:
     - custom element tags (ytd-*, yt-*) are Polymer component names and
       have survived years;
     - ids are internal to a component's template, so they go when that
       component is rewritten — these are what the fallbacks are for;
     - FRAME_PATH is the chat iframe's URL, which YouTube cannot rename
       without breaking its own chat. It is the only name in this file
       that is not YouTube's to change, which is why the health tripwire
       in dock.js is built on it rather than on any id. */
YTCHAT.SEL = {
  // The spine. dock.css is keyed on this too, and CSS has no fallback
  // mechanism, so losing it is unrecoverable rather than degraded.
  watch: ['ytd-watch-flexy'],

  /* Ground truth that this page has chat. Matched against each iframe's
     contentWindow.location.pathname, NOT against a [src] selector.

     Measured on a live stream: the chat iframe has src="" as a property and
     NO src attribute at all (getAttribute returns null) — YouTube populates
     the frame without ever setting one. `iframe[src*="/live_chat"]` therefore
     matches nothing, on a page whose chat is open and working. The frame's
     contentWindow.location.pathname reads exactly "/live_chat", and the
     document is same-origin, so dock.js can reach it. */
  framePath: '/live_chat',

  // Page mode: the frame element inside #secondary.
  panelPage: ['ytd-live-chat-frame#chat', 'ytd-live-chat-frame', '#chat-container'],

  /* Theater. The frame comes first, not #chat-container, because YouTube now
     pins the frame itself (position:fixed, right:0) and leaves the container
     collapsed — measured width 0 on three theater pages, which made the
     divider hide itself rather than sit on a zero-width box. The frame is the
     right answer under the legacy layout too: section 2c gives it
     width/height 100% of the container it is docking, so the two boxes are
     identical there and only the frame is correct in both. */
  panelTheater: ['ytd-live-chat-frame#chat', 'ytd-live-chat-frame', '#chat-container'],

  // True fullscreen: a different container entirely.
  panelFs: ['#panels-full-bleed-container', '#panels-container'],

  // The empty reservation theater docking is positioned over. No frame
  // fallback is possible: in theater the chat is NOT in this element.
  slotTheater: ['#panels-full-bleed-container'],

  /* The video column. Only its used max-width is read, and only to hand CSS
     the ceiling the player cannot grow past — see syncCap() in dock.js. A
     miss here is harmless: --ytchat-cap falls back to 0px, which collapses
     the sidebar floor onto YouTube's own sidebar width and leaves the
     recommended list at its stock size. */
  primary: ['#primary.ytd-watch-flexy', '#primary'],

  /* The video box, read only to find the middle of the gutter the divider
     sits in. #movie_player is used rather than #primary or
     #player-full-bleed-container because it is the one element that exists,
     and carries the real painted edge of the video, in all three modes.
     A miss, or a gutter outside the sane range, falls the divider back onto
     the panel edge it used before v1.9.1 — the old position, never a wild
     one. */
  player: ['#movie_player', '#player-container', '#player'],
};

YTCHAT.ALL_KEYS = Object.keys(YTCHAT.DEF);

/* Widths are clamped against MIN/MAX here and again against the live viewport
   in dock.js — the popup has no viewport to measure. */
YTCHAT.clampWidth = function (px) {
  var n = parseFloat(px);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(YTCHAT.MAX, Math.max(YTCHAT.MIN, n)));
};

YTCHAT.isOn = function (v) { return String(v) === '1'; };
