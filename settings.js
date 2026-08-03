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
  },

  DEF: {
    'ytchat-w': '440',
    'ytchat-fsw': '560',
    'ytchat-flip': '0',
    'ytchat-enabled': '1',
    'ytchat-divider': '1',
  },
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
