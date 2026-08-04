/* =============================================================
   YouTube Chat Dock — drag divider

   Runs in the top frame only. The chat iframe needs styling
   (dock.css, injected there by the manifest) but no script.
   ============================================================= */
(function () {
  'use strict';

  if (window.top !== window.self) return;

  /* Bounds, key names and defaults live in settings.js, which the manifest
     loads immediately before this file and popup.html loads as a plain
     script. One definition, two worlds — the popup and the page cannot drift
     apart on what "ytchat-w" means or what its default is. */
  const MIN = YTCHAT.MIN;
  const MAX = YTCHAT.MAX;
  const KEEP_FOR_VIDEO = YTCHAT.KEEP_FOR_VIDEO;
  const TOP_GAP = YTCHAT.TOP_GAP;
  const TICK_MS = 400;

  const MODES = {
    page:    { cssVar: '--ytchat-w', key: YTCHAT.K.page, def: Number(YTCHAT.DEF[YTCHAT.K.page]) },
    fs:      { cssVar: '--ytchat-fsw', key: YTCHAT.K.fs, def: Number(YTCHAT.DEF[YTCHAT.K.fs]) },
    theater: { cssVar: '--ytchat-tw', key: YTCHAT.K.tw, def: Number(YTCHAT.DEF[YTCHAT.K.tw]) },
  };

  const FLIP_KEY = YTCHAT.K.flip;

  const root = document.documentElement;

  /* Every borrowed name comes from the table in settings.js. Resolution walks
     the list in order and stops at the first hit — one querySelector per
     candidate rather than one comma-separated list, because a selector list
     returns the first match in document order, not the first selector that
     matched. See the comment on YTCHAT.SEL.

     Cost is unchanged on the healthy path: the preferred selector hits on the
     first try, so the 400ms tick still runs exactly one querySelector. Only a
     miss pays for the rest of the list. */
  function first(sels) {
    for (let i = 0; i < sels.length; i++) {
      const el = document.querySelector(sels[i]);
      if (el) return el;
    }
    return null;
  }

  const SEL = YTCHAT.SEL;
  const WATCH = SEL.watch[0];
  const scoped = (prefix, sels) => sels.map((s) => prefix + ' ' + s);

  const inFullscreen = () => !!document.querySelector(WATCH + '[fullscreen]');
  /* Theater and fullscreen are separate attributes and can both be present
     during the transition, so theater must exclude fullscreen explicitly. */
  const inTheater = () =>
    !!document.querySelector(WATCH + '[theater]:not([fullscreen])');

  const PANEL_FS = scoped(WATCH + '[fullscreen]', SEL.panelFs);
  const PANEL_TH = scoped(WATCH + '[theater]', SEL.panelTheater);
  const PANEL_PG = scoped(WATCH + ':not([fullscreen])', SEL.panelPage);
  const SLOT_TH = scoped(WATCH + '[theater]:not([fullscreen])', SEL.slotTheater);

  function mode() {
    if (inFullscreen()) return MODES.fs;
    if (inTheater()) return MODES.theater;
    return MODES.page;
  }

  /* A width saved on a 2560px monitor must not be restored verbatim onto a
     1280px laptop — that would leave the player a sliver. Clamp against the
     current viewport every time, not just against the static MAX. */
  function clamp(px) {
    const ceiling = Math.max(MIN, Math.min(MAX, window.innerWidth - KEEP_FOR_VIDEO));
    return Math.round(Math.min(ceiling, Math.max(MIN, px)));
  }

  /* ---- storage: two stores, one of them synchronous --------------------

     localStorage stays the source of truth for FIRST PAINT. It is the only
     store readable synchronously at document_start, and reading it there is
     what stops the page painting the default width and then jumping. That
     property is why it survived the popup being added.

     chrome.storage.local exists because the popup is an extension page and
     physically cannot reach youtube.com's localStorage — that origin belongs
     to the page. So it is the channel, not the source: the popup writes it,
     and the mirror below copies it down into localStorage.

     Consequence, stated plainly: change a setting in the popup, and the NEXT
     YouTube load applies it asynchronously, so it can land a frame late.
     Every load after that is synchronous again, because the mirror has run.
     Widths dragged on the page are written to both at once and never lag. */
  /* Writing a custom property on documentElement invalidates style for the
     WHOLE document, so writing one that has not changed is not free — and the
     400ms tick plus every pointermove in a theater drag was rewriting the same
     six values unconditionally. Cache the last value written and skip the
     no-ops; only real changes reach the style system now.

     The cache mirrors inline properties on <html>, which YouTube never touches
     and never replaces. It is still reset on navigation, because a stale cache
     would silently stop applying a width and that failure would be invisible. */
  const varCache = Object.create(null);

  function setVar(name, value) {
    if (varCache[name] === value) return;
    varCache[name] = value;
    root.style.setProperty(name, value);
  }

  function setAttr(name, on) {
    if (root.hasAttribute(name) === on) return;
    if (on) root.setAttribute(name, '');
    else root.removeAttribute(name);
  }

  const applyVar = (m, px) => setVar(m.cssVar, px + 'px');

  function lsGet(key) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? YTCHAT.DEF[key] : v;
    } catch (e) {
      return YTCHAT.DEF[key]; // storage disabled / partitioned
    }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) { /* ignore */ }
  }

  /* chrome.* throws rather than returning undefined once the extension is
     reloaded or updated underneath a still-open tab. Every access is guarded
     so an orphaned tab degrades to localStorage-only instead of throwing
     2.5 times a second. */
  function area() {
    try {
      return (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
        ? chrome.storage.local : null;
    } catch (e) {
      return null;
    }
  }

  function extSet(key, value) {
    const a = area();
    if (!a) return;
    try {
      const patch = {};
      patch[key] = String(value);
      a.set(patch, () => void chrome.runtime.lastError);
    } catch (e) { /* orphaned context */ }
  }

  /* Write-through: the page is the one writer that can reach both stores, so
     it keeps them byte-identical and the mirror below stays a no-op. */
  function put(key, value) {
    lsSet(key, value);
    extSet(key, value);
  }

  function readStored(m) {
    const px = parseFloat(lsGet(m.key));
    return Number.isFinite(px) ? px : m.def;
  }

  /* The side toggle is stored as a *flip*, not as "left"/"right", because
     `order: -1` moves a flex item to the row's START — which is the left in
     LTR and the right in RTL. One boolean therefore means "the other side"
     in both locales, and the geometric side detection below keeps working
     without knowing why the panel moved. */
  let flipped = false;
  let enabled = true;
  let dividerOn = true;
  let theaterOn = true;
  let lang = 'en';
  let healthy = true;

  function applyFlip(on) {
    flipped = on;
    // Attribute, not a class: YouTube owns className on <html>, nothing owns this.
    setAttr('data-ytchat-flip', on);
  }

  /* The off switch is an attribute rather than a stylesheet swap, because
     dock.css is injected statically by the manifest and cannot be unloaded.
     Every layout rule in it is gated on :root:not([data-ytchat-off]), so
     setting this attribute at document_start hands the page back to YouTube
     before first paint — disabled means no flash of a docked layout either. */
  function applyEnabled(on) {
    enabled = on;
    applyGate();
  }

  /* One attribute, two independent reasons to be off: the user's switch and
     the health tripwire below. Kept as separate booleans on purpose — a
     tripped tripwire must never be written back to storage, or a YouTube
     experiment that lasts an afternoon would leave the extension latched off
     for a user who never touched the setting. */
  function applyGate() {
    setAttr('data-ytchat-off', !(enabled && healthy));
  }

  /* ---- health: notice YouTube renaming the DOM out from under us -------

     dock.css borrows the same names dock.js does, and CSS has no fallback
     mechanism: if YouTube renames #secondary or ytd-watch-flexy, every layout
     rule simply stops matching and nothing JS can do puts the dock back. So
     the goal here is not rescue, it is a clean failure — stop drawing a
     divider that resizes something no longer listening, and hand the page back
     to YouTube whole rather than half-docked.

     The hard part is telling a rename apart from the many ordinary reasons the
     panel is absent: chat closed, an ordinary video with no chat at all, a
     non-watch page, theater docking switched off, below the 1000px breakpoint.
     The discriminator is the chat iframe matched on its /live_chat URL — the
     one name in the contract that is not YouTube's to rename, since changing
     it breaks their own chat. A visible /live_chat iframe with no resolvable
     panel anywhere around it is a rename and nothing else.

     Held for MISS_TICKS (1.6s) before acting so an SPA navigation caught
     mid-relayout cannot trip it, and released the instant a panel resolves
     again — a transient must not latch. */
  const MISS_TICKS = 4;
  let missStreak = 0;
  let healthLogged = false;

  function setHealthy(on) {
    if (healthy === on) return;
    healthy = on;
    applyGate();
    setAttr('data-ytchat-degraded', !on);
    ensureMounted();
    if (!on && !healthLogged) {
      healthLogged = true;
      console.warn('[YouTube Chat Dock] chat is present but its container no ' +
        'longer matches any known selector — standing down so the page keeps ' +
        "YouTube's own layout. Please report this: " +
        'https://github.com/cc100053/YouTube-Chat-Dock/issues');
    }
  }

  function probeHealth() {
    if (!enabled) return;
    // Cheapest path first, and the only one that runs when nothing is wrong.
    if (panel()) { missStreak = 0; return setHealthy(true); }
    // Theater docking switched off is a deliberate null, not a miss.
    if (inTheater() && !theaterOn) return void (missStreak = 0);
    const f = chatFrame();
    if (!f) return void (missStreak = 0);   // no chat on this page at all
    const r = f.getBoundingClientRect();
    // Chat collapsed, hidden, or the page below the single-column breakpoint.
    if (r.width < 1 || r.height < 40) return void (missStreak = 0);
    if (++missStreak >= MISS_TICKS) setHealthy(false);
  }

  function restore() {
    applyEnabled(YTCHAT.isOn(lsGet(YTCHAT.K.enabled)));
    dividerOn = YTCHAT.isOn(lsGet(YTCHAT.K.divider));
    theaterOn = YTCHAT.isOn(lsGet(YTCHAT.K.theater));
    lang = ytchatResolveLang(lsGet(YTCHAT.K.lang), uiLanguage());
    relabel();
    for (const m of Object.values(MODES)) applyVar(m, clamp(readStored(m)));
    setVar('--ytchat-top', TOP_GAP + 'px');
    applyFlip(YTCHAT.isOn(lsGet(FLIP_KEY)));
  }

  function readWidth() {
    const v = parseFloat(getComputedStyle(root).getPropertyValue(mode().cssVar));
    return Number.isFinite(v) ? v : mode().def;
  }

  function writeWidth(px) {
    const m = mode();
    px = clamp(px);
    applyVar(m, px);
    put(m.key, px);
    return px;
  }

  /* Three modes, three different elements, because YouTube reparents chat.
     Measured: page mode #chat-container sits in #secondary-inner; theater
     mode the same element is a direct child of #columns; fullscreen uses
     #panels-full-bleed-container instead. */
  function panel() {
    if (inFullscreen()) return first(PANEL_FS);
    if (inTheater()) {
      // Docking off in theater means YouTube's stock layout, and no divider.
      return theaterOn ? first(PANEL_TH) : null;
    }
    return first(PANEL_PG);
  }

  /* The chat iframe, found by its URL rather than by any name YouTube owns.

     It has to be found by walking the iframes and reading each one's location:
     measured on a live stream with chat open, the chat frame carries no src
     attribute at all (getAttribute -> null, .src -> ""), so the obvious
     `iframe[src*="/live_chat"]` matches nothing. Its contentWindow.location
     .pathname is "/live_chat" and the document is same-origin.

     Cross-origin frames on the watch page (accounts.youtube.com, the identity
     frame) throw SecurityError on that read, so every access is guarded — the
     throw is the normal case for those, not an error worth reporting.

     Deliberately NOT used as a panel fallback, even though its rect is the
     right box: the divider it would place has nothing behind it. dock.css is
     keyed on the same ids panel() is, and CSS cannot fall back — if those ids
     are gone the layout is already YouTube's stock, so a divider drawn off the
     iframe would drag a width that nothing responds to. That is a worse
     failure than no divider. Its job here is detection only, which is also why
     it is only ever called after panel() has already missed. */
  function chatFrame() {
    const frames = document.getElementsByTagName('iframe');
    for (let i = 0; i < frames.length; i++) {
      try {
        const p = frames[i].contentWindow.location.pathname;
        if (p && p.indexOf(YTCHAT.SEL.framePath) === 0) return frames[i];
      } catch (e) { /* cross-origin frame — not ours, and not a problem */ }
    }
    return null;
  }

  /* Theater is the one mode whose panel is positioned by us rather than by
     flex, so its box has to be measured off the slot YouTube reserves and
     handed to CSS. data-ytchat-theater is set only once the numbers are real,
     which is what keeps section 2c inert (and the chat unmoved) until then. */
  function syncTheater() {
    if (!enabled || !healthy || !theaterOn || !inTheater()) {
      return setAttr('data-ytchat-theater', false);
    }
    const slot = first(SLOT_TH);
    if (!slot) return setAttr('data-ytchat-theater', false);
    const r = slot.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return setAttr('data-ytchat-theater', false);
    setVar('--ytchat-tt', Math.round(r.top) + 'px');
    setVar('--ytchat-tl', Math.round(r.left) + 'px');
    setVar('--ytchat-th', Math.round(r.height) + 'px');
    setAttr('data-ytchat-theater', true);
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

  /* Strings come from the table in i18n.js, not chrome.i18n, because
     chrome.i18n always resolves to the browser's UI language and gives the
     user no way to override it. Only the browser's language *default* still
     comes from chrome.i18n, and that call can throw in an orphaned tab. */
  function uiLanguage() {
    try {
      return (chrome.i18n && chrome.i18n.getUILanguage()) || 'en';
    } catch (e) {
      return 'en';
    }
  }

  const t = (key) => ytchatMsg(key, lang);

  // ---- divider ---------------------------------------------------------
  const handle = document.createElement('div');
  handle.id = 'ytchat-resizer';
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  /* A focusable separator is the ARIA window-splitter pattern, and it needs a
     value to be one. Without tabIndex the resize was pointer-only: the popup
     sliders were the sole keyboard route, and they are two clicks away in
     another surface. The handle is display:none whenever it is not applicable,
     which takes it out of the tab order too — so this adds exactly one stop on
     a watch page with chat open, and none anywhere else. */
  handle.tabIndex = 0;
  handle.setAttribute('aria-valuemin', String(MIN));
  handle.setAttribute('aria-valuemax', String(MAX));

  const readout = document.createElement('span');
  readout.className = 'ytchat-readout';
  handle.appendChild(readout);

  /* The side toggle stays on the divider even though the popup now offers the
     same switch: flipping sides is a thing you want while looking at the
     layout, and reaching the toolbar to do it means losing fullscreen. The
     popup and this button write the same key, so they never disagree.

     Every listener stops propagation: the divider below it treats pointerdown
     as "start dragging" and dblclick as "reset width". */
  const flipBtn = document.createElement('button');
  flipBtn.id = 'ytchat-flip-btn';
  flipBtn.type = 'button';
  flipBtn.textContent = '⇄';
  handle.appendChild(flipBtn);

  /* Re-run on every restore(), so switching language in the popup relabels a
     tab that is already open instead of waiting for a reload. */
  let labelledLang = null;

  function relabel() {
    if (labelledLang === lang) return;
    labelledLang = lang;
    handle.title = t('dividerTitle');
    handle.setAttribute('aria-label', t('dividerAria'));
    flipBtn.title = t('flipAria');
    flipBtn.setAttribute('aria-label', t('flipAria'));
  }

  let shield = null;
  let dragging = false;

  function hide() { handle.style.display = 'none'; }

  function reposition() {
    if (dragging) return;
    syncTheater();
    // Switched off entirely, stood down by the health tripwire, or the user
    // kept the layout but hid the handle.
    if (!enabled || !healthy || !dividerOn) return hide();
    const el = panel();
    if (!el) return hide();
    const r = el.getBoundingClientRect();
    // Chat closed, collapsed, or below the single-column breakpoint.
    if (r.height < 40 || r.width < 1 || window.innerWidth < 1000) return hide();
    handle.style.display = 'flex';
    handle.style.left = innerEdge(r) + 'px';
    handle.style.top = r.top + 'px';
    handle.style.height = r.height + 'px';
    handle.setAttribute('aria-valuenow', String(Math.round(readWidth())));
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
      // In theater the panel is fixed-positioned, so its box only follows the
      // width if the measured geometry is refreshed on every move.
      syncTheater();
      readout.textContent = px + 'px';
      const el = panel();
      if (el) handle.style.left = innerEdge(el.getBoundingClientRect()) + 'px';
    };
    const onUp = () => endDrag(onMove, onUp);

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  });

  /* Keyboard resizing, mirroring the drag exactly: widening means moving
     toward the video, which is rightwards when the panel is on the left and
     leftwards when it is on the right. Resolved from geometry per keystroke
     for the same reason the drag resolves it once at pointerdown — the side is
     never assumed.

     The readout is shown briefly after each keystroke, because a resize with
     no number is a resize you cannot aim. */
  let keyEchoTimer = 0;

  handle.addEventListener('keydown', safe((e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const el = panel();
    if (!el) return;
    const onLeft = panelOnLeft(el.getBoundingClientRect());
    const step = (e.shiftKey ? 5 : 1) * YTCHAT.STEP;
    let px;
    switch (e.key) {
      case 'ArrowLeft':  px = readWidth() + (onLeft ? -step : step); break;
      case 'ArrowRight': px = readWidth() + (onLeft ? step : -step); break;
      case 'Home':       px = MIN; break;
      case 'End':        px = MAX; break;   // clamp() cuts this to the viewport
      case 'Enter':
      case ' ':          px = mode().def; break;
      default: return;
    }
    /* stopPropagation matters as much as preventDefault here: YouTube binds
       its own shortcuts at document level, where arrows seek the video and
       Space toggles playback. preventDefault alone would not stop those —
       handlers that never check defaultPrevented would still fire, so
       resizing with the keyboard would also scrub the video. */
    e.preventDefault();
    e.stopPropagation();
    const set = writeWidth(px);
    readout.textContent = set + 'px';
    handle.classList.add('keying');
    clearTimeout(keyEchoTimer);
    keyEchoTimer = setTimeout(() => handle.classList.remove('keying'), 900);
    window.dispatchEvent(new Event('resize'));
    reposition();
  }));

  handle.addEventListener('dblclick', () => {
    writeWidth(mode().def);
    window.dispatchEvent(new Event('resize'));
    reposition();
  });

  function toggleSide() {
    applyFlip(!flipped);
    put(FLIP_KEY, flipped ? '1' : '0');
    window.dispatchEvent(new Event('resize'));
    reposition();
    // YouTube resizes the player asynchronously; re-measure once it has.
    setTimeout(() => safeReposition(), 120);
  }

  flipBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  flipBtn.addEventListener('dblclick', (e) => e.stopPropagation());
  flipBtn.addEventListener('click', safe((e) => {
    e.stopPropagation();
    toggleSide();
  }));

  /* "Off" should mean nothing of ours is in the page, not merely that our node
     is display:none. Previously the divider was appended regardless and the
     400ms tick re-appended it, so a user who switched the extension off still
     carried an element on every watch page. */
  function ensureMounted() {
    const wanted = enabled && healthy && dividerOn;
    if (!wanted) {
      if (handle.isConnected) handle.remove();
      return;
    }
    if (document.body && !handle.isConnected) document.body.appendChild(handle);
  }

  function mount() {
    restore();
    ensureMounted();
    reposition();
  }

  /* Re-apply after a settings change and make YouTube recompute its own
     player layout, which it does not do on a CSS-driven resize.

     The trailing re-measure is coalesced because a popup slider now writes on
     every animation frame while it is dragged: without the clear, one drag
     would leave dozens of overlapping timers queued, all re-measuring after
     the drag had already finished. */
  let reapplyTimer = 0;

  function reapply() {
    restore();
    window.dispatchEvent(new Event('resize'));
    reposition();
    clearTimeout(reapplyTimer);
    reapplyTimer = setTimeout(() => safeReposition(), 120);
  }

  /* ---- mirror: chrome.storage.local -> localStorage --------------------

     Runs once per page load, after first paint has already happened off the
     synchronous localStorage read. Two directions, and which one wins is not
     symmetric:

       - a key the extension store has never seen is SEEDED from localStorage,
         so widths dragged before this version existed survive the upgrade;
       - a key that differs is copied DOWN into localStorage, because the only
         writer that can produce a difference is the popup, which cannot write
         localStorage itself.

     A page drag writes both stores at once, so it never reaches either branch. */
  function syncFromExtensionStore() {
    const a = area();
    if (!a) return;
    try {
      a.get(YTCHAT.ALL_KEYS, (got) => {
        if (chrome.runtime.lastError) return;
        const seed = {};
        let changed = false;
        for (const k of YTCHAT.ALL_KEYS) {
          const mine = lsGet(k);
          if (got[k] === undefined) seed[k] = mine;
          else if (String(got[k]) !== String(mine)) { lsSet(k, got[k]); changed = true; }
        }
        if (Object.keys(seed).length) a.set(seed, () => void chrome.runtime.lastError);
        if (changed) safe(reapply)();
      });
    } catch (e) { /* orphaned context */ }
  }

  /* Live updates while the popup is open, so a toggle is visible on the page
     behind it without a reload. */
  function watchExtensionStore() {
    try {
      if (!chrome.storage || !chrome.storage.onChanged) return;
      chrome.storage.onChanged.addListener((changes, where) => {
        if (where !== 'local') return;
        let changed = false;
        for (const k of YTCHAT.ALL_KEYS) {
          if (!(k in changes)) continue;
          const v = changes[k].newValue;
          if (v === undefined) continue;
          if (String(v) !== String(lsGet(k))) { lsSet(k, v); changed = true; }
        }
        if (changed) safe(reapply)();
      });
    } catch (e) { /* orphaned context */ }
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
    /* Only the 400ms tick probes health, not reposition() — reposition also
       runs on every scroll event, and the probe's extra queries have no reason
       to run at that rate. */
    probeHealth();
    // YouTube can replace <body> wholesale on some navigations.
    ensureMounted();
    reposition();
  }

  safeMount();
  safe(syncFromExtensionStore)();
  safe(watchExtensionStore)();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeMount, { once: true });
  }

  /* YouTube is an SPA and the player relayouts asynchronously; no single
     event is reliable, so poll cheaply (one querySelector + one rect). */
  addEventListener('resize', safe(() => { restore(); reposition(); }), { passive: true });
  addEventListener('scroll', safeReposition, { passive: true });
  addEventListener('fullscreenchange', () => setTimeout(safeReposition, 120));
  addEventListener('yt-navigate-finish', safe(() => {
    // A stale cache would silently stop applying a width, and that failure is
    // invisible — so drop it on navigation rather than trust it across one.
    for (const k in varCache) delete varCache[k];
    mount();
    setTimeout(safeReposition, 400);
  }));
  setInterval(safe(tick), TICK_MS);
})();
