/* =============================================================
   YouTube Chat Dock — drag divider

   Runs in the top frame only. The chat iframe needs styling
   (dock.css, injected there by the manifest) but no script.
   ============================================================= */
(function () {
  'use strict';

  if (window.top !== window.self) return;

  const MIN = 120;      // narrower than this chat is unreadable, not broken
  const MAX = 1100;
  const KEEP_FOR_VIDEO = 480; // never let chat squeeze the player below this
  const TOP_GAP = 72;
  const TICK_MS = 400;

  const MODES = {
    page: { cssVar: '--ytchat-w', key: 'ytchat-w', def: 440 },
    fs:   { cssVar: '--ytchat-fsw', key: 'ytchat-fsw', def: 560 },
  };

  const root = document.documentElement;
  const inFullscreen = () => !!document.querySelector('ytd-watch-flexy[fullscreen]');
  const mode = () => (inFullscreen() ? MODES.fs : MODES.page);

  /* A width saved on a 2560px monitor must not be restored verbatim onto a
     1280px laptop — that would leave the player a sliver. Clamp against the
     current viewport every time, not just against the static MAX. */
  function clamp(px) {
    const ceiling = Math.max(MIN, Math.min(MAX, window.innerWidth - KEEP_FOR_VIDEO));
    return Math.round(Math.min(ceiling, Math.max(MIN, px)));
  }

  /* Inline custom properties beat every stylesheet, so a stored width always
     wins over the defaults in dock.css.

     Storage is localStorage rather than chrome.storage.local on purpose:
     chrome.storage is async, which would paint the default width first and
     then jump on every page load, and it would require the "storage"
     permission. Synchronous read at document_start keeps the extension both
     flicker-free and permission-free. Trade-off: widths are lost if the user
     clears site data for youtube.com. */
  const applyVar = (m, px) => root.style.setProperty(m.cssVar, px + 'px');

  function readStored(m) {
    try {
      const px = parseFloat(localStorage.getItem(m.key));
      return Number.isFinite(px) ? px : m.def;
    } catch (e) {
      return m.def; // storage disabled / partitioned
    }
  }

  function restore() {
    for (const m of Object.values(MODES)) applyVar(m, clamp(readStored(m)));
    root.style.setProperty('--ytchat-top', TOP_GAP + 'px');
  }

  function readWidth() {
    const v = parseFloat(getComputedStyle(root).getPropertyValue(mode().cssVar));
    return Number.isFinite(v) ? v : mode().def;
  }

  function writeWidth(px) {
    const m = mode();
    px = clamp(px);
    applyVar(m, px);
    try { localStorage.setItem(m.key, String(px)); } catch (e) { /* ignore */ }
    return px;
  }

  /* In fullscreen YouTube moves chat into #panels-full-bleed-container and
     hides #columns, so the element to measure differs per mode. */
  function panel() {
    return inFullscreen()
      ? document.querySelector('ytd-watch-flexy[fullscreen] #panels-full-bleed-container')
      : document.querySelector('ytd-watch-flexy:not([fullscreen]) ytd-live-chat-frame#chat');
  }

  /* RTL locales mirror the layout and put chat on the LEFT, which flips both
     the divider's edge and the direction that widens it.

     Detection is geometric on purpose. Reading `direction` off
     documentElement does NOT work: with hl=ar YouTube leaves <html> at
     direction:ltr and applies rtl to <body> instead (measured — chat at
     left:18 right:409, player starting at 409). Measuring where the panel
     actually sits is immune to which element YouTube decides to flag, and
     stays correct if that internal detail changes. */
  function panelOnLeft(rect) {
    return (rect.left + rect.right) / 2 < window.innerWidth / 2;
  }

  /* The edge facing the video — the one the divider grabs. */
  function innerEdge(rect) {
    return (panelOnLeft(rect) ? rect.right : rect.left) - 5;
  }

  // ---- divider ---------------------------------------------------------
  const handle = document.createElement('div');
  handle.id = 'ytchat-resizer';
  handle.title = 'Drag to resize chat · double-click to reset';
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('aria-label', 'Resize chat panel');

  const readout = document.createElement('span');
  readout.className = 'ytchat-readout';
  handle.appendChild(readout);

  let shield = null;
  let dragging = false;

  function hide() { handle.style.display = 'none'; }

  function reposition() {
    if (dragging) return;
    const el = panel();
    if (!el) return hide();
    const r = el.getBoundingClientRect();
    // Chat closed, collapsed, or below the single-column breakpoint.
    if (r.height < 40 || r.width < 1 || window.innerWidth < 1000) return hide();
    handle.style.display = 'flex';
    handle.style.left = innerEdge(r) + 'px';
    handle.style.top = r.top + 'px';
    handle.style.height = r.height + 'px';
    // Keep the px readout on the video side of the divider in both directions.
    handle.classList.toggle('ytchat-flip', panelOnLeft(r));
  }

  function endDrag(onMove, onUp) {
    dragging = false;
    handle.classList.remove('dragging');
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
    if (shield) { shield.remove(); shield = null; }
    // Nudge YouTube into recomputing its own player layout.
    window.dispatchEvent(new Event('resize'));
    reposition();
  }

  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    const startX = e.clientX;
    const startW = readWidth();
    /* Resolved once, at grab time: the side must not flip mid-drag even if a
       relayout momentarily reports different geometry. */
    const startEl = panel();
    const onLeft = startEl ? panelOnLeft(startEl.getBoundingClientRect()) : false;
    handle.classList.add('dragging');
    readout.textContent = startW + 'px';
    try { handle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

    /* Pointer capture alone isn't enough insurance: the shield also stops the
       chat iframe hit-testing the pointer away mid-drag. */
    shield = document.createElement('div');
    shield.id = 'ytchat-resizer-shield';
    (document.body || root).appendChild(shield);

    const onMove = (ev) => {
      /* Widen by dragging toward the video: left in LTR, right in RTL. */
      const delta = onLeft ? (ev.clientX - startX) : (startX - ev.clientX);
      const px = writeWidth(startW + delta);
      readout.textContent = px + 'px';
      const el = panel();
      if (el) handle.style.left = innerEdge(el.getBoundingClientRect()) + 'px';
    };
    const onUp = () => endDrag(onMove, onUp);

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  });

  handle.addEventListener('dblclick', () => {
    writeWidth(mode().def);
    window.dispatchEvent(new Event('resize'));
    reposition();
  });

  function mount() {
    restore();
    if (document.body && !handle.isConnected) document.body.appendChild(handle);
    reposition();
  }

  /* One throw must not kill the loop or spam the console every 400ms. */
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

  const safeReposition = safe(reposition);
  const safeMount = safe(mount);

  function tick() {
    // YouTube can replace <body> wholesale on some navigations.
    if (document.body && !handle.isConnected) document.body.appendChild(handle);
    reposition();
  }

  safeMount();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeMount, { once: true });
  }

  /* YouTube is an SPA and the player relayouts asynchronously; no single
     event is reliable, so poll cheaply (one querySelector + one rect). */
  addEventListener('resize', safe(() => { restore(); reposition(); }), { passive: true });
  addEventListener('scroll', safeReposition, { passive: true });
  addEventListener('fullscreenchange', () => setTimeout(safeReposition, 120));
  addEventListener('yt-navigate-finish', safe(() => {
    mount();
    setTimeout(safeReposition, 400);
  }));
  setInterval(safe(tick), TICK_MS);
})();
