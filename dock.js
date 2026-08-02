/* =============================================================
   YouTube Chat Dock — drag divider
   Runs in the top frame only. The chat iframe needs styling
   (dock.css, injected there by the manifest) but no script.
   ============================================================= */
(function () {
  'use strict';

  if (window.top !== window.self) return;

  const MIN = 120;   // narrower than this and chat is unreadable, not broken
  const MAX = 1100;
  const TOP_GAP = 72;

  const MODES = {
    page: { cssVar: '--ytchat-w', key: 'ytchat-w', def: 440 },
    fs:   { cssVar: '--ytchat-fsw', key: 'ytchat-fsw', def: 560 },
  };

  const root = document.documentElement;
  const inFullscreen = () => !!document.querySelector('ytd-watch-flexy[fullscreen]');
  const mode = () => (inFullscreen() ? MODES.fs : MODES.page);

  /* Inline custom properties beat every stylesheet, so a stored width always
     wins over the defaults in dock.css. */
  const applyVar = (m, px) => root.style.setProperty(m.cssVar, px + 'px');

  function restore() {
    for (const m of Object.values(MODES)) {
      let saved = null;
      try { saved = localStorage.getItem(m.key); } catch (e) { /* private mode */ }
      const px = parseFloat(saved);
      applyVar(m, Number.isFinite(px) ? Math.min(MAX, Math.max(MIN, px)) : m.def);
    }
    root.style.setProperty('--ytchat-top', TOP_GAP + 'px');
  }

  function readWidth() {
    const v = parseFloat(getComputedStyle(root).getPropertyValue(mode().cssVar));
    return Number.isFinite(v) ? v : mode().def;
  }

  function writeWidth(px) {
    const m = mode();
    px = Math.round(Math.min(MAX, Math.max(MIN, px)));
    applyVar(m, px);
    try { localStorage.setItem(m.key, String(px)); } catch (e) { /* private mode */ }
    return px;
  }

  /* In fullscreen YouTube moves chat into #panels-full-bleed-container and
     hides #columns, so the element to measure differs per mode. */
  function panel() {
    return inFullscreen()
      ? document.querySelector('ytd-watch-flexy[fullscreen] #panels-full-bleed-container')
      : document.querySelector('ytd-watch-flexy:not([fullscreen]) ytd-live-chat-frame#chat');
  }

  // ---- divider ---------------------------------------------------------
  const handle = document.createElement('div');
  handle.id = 'ytchat-resizer';
  handle.title = 'Drag to resize chat · double-click to reset';
  const readout = document.createElement('span');
  readout.className = 'ytchat-readout';
  handle.appendChild(readout);

  let shield = null;
  let dragging = false;

  function reposition() {
    if (dragging) return;
    const el = panel();
    if (!el) { handle.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    if (r.height < 40 || r.width < 1) { handle.style.display = 'none'; return; }
    handle.style.display = 'flex';
    handle.style.left = (r.left - 5) + 'px';
    handle.style.top = r.top + 'px';
    handle.style.height = r.height + 'px';
  }

  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    const startX = e.clientX;
    const startW = readWidth();
    handle.classList.add('dragging');
    readout.textContent = startW + 'px';
    handle.setPointerCapture(e.pointerId);

    /* Pointer capture alone isn't enough insurance: the shield also stops the
       chat iframe hit-testing the pointer away mid-drag. */
    shield = document.createElement('div');
    shield.id = 'ytchat-resizer-shield';
    document.body.appendChild(shield);

    const onMove = (ev) => {
      // Panel is right-anchored: dragging left widens it.
      const px = writeWidth(startW + (startX - ev.clientX));
      readout.textContent = px + 'px';
      const el = panel();
      if (el) handle.style.left = (el.getBoundingClientRect().left - 5) + 'px';
    };

    const onUp = () => {
      dragging = false;
      handle.classList.remove('dragging');
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      if (shield) { shield.remove(); shield = null; }
      // Nudge YouTube into recomputing its own player layout.
      window.dispatchEvent(new Event('resize'));
      reposition();
    };

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

  restore();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  /* YouTube is an SPA and the player relayouts asynchronously; no single
     event is reliable, so poll cheaply (one getBoundingClientRect). */
  addEventListener('resize', reposition, { passive: true });
  addEventListener('scroll', reposition, { passive: true });
  addEventListener('fullscreenchange', () => setTimeout(reposition, 120));
  addEventListener('yt-navigate-finish', () => { mount(); setTimeout(reposition, 400); });
  setInterval(reposition, 400);
})();
