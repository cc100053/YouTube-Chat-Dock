/* =============================================================
   YouTube Chat Dock — settings popup

   The popup writes chrome.storage.local and nothing else. It
   cannot touch youtube.com's localStorage: that origin belongs
   to the page, not to this extension page. dock.js owns the
   mirror in the other direction — see the comment there.
   ============================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     SET THIS BEFORE PUBLISHING.

     Your Buy Me a Coffee (or Ko-fi, or GitHub Sponsors) page. While it is
     empty the link is hidden rather than rendered dead — a donate button
     that 404s is worse than no donate button, and a *guessed* donation URL
     is worse still, because the money would go to whoever does own it.

     store/package.sh refuses to build the upload ZIP while this is empty,
     so it cannot reach the store by accident.
     ------------------------------------------------------------------ */
  var COFFEE_URL = '';

  var $ = function (id) { return document.getElementById(id); };

  /* ---- language -------------------------------------------------------
     Resolved from the stored preference first and the browser only as a
     fallback, which is the whole point of the picker: chrome.i18n would
     always force the browser's UI language. */
  var lang = 'en';

  function uiLanguage() {
    try {
      return (chrome.i18n && chrome.i18n.getUILanguage()) || 'en';
    } catch (e) {
      return 'en';
    }
  }

  function msg(key) { return ytchatMsg(key, lang); }

  function applyLanguage(pref) {
    lang = ytchatResolveLang(pref, uiLanguage());
    document.documentElement.lang = lang.replace(/_/g, '-');
    document.documentElement.dir = ytchatIsRtl(lang) ? 'rtl' : 'ltr';
    document.title = msg('extName');

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-i18n]'),
      function (el) { el.textContent = msg(el.dataset.i18n); }
    );

    // The picker's own auto entry is the only option that needs translating;
    // the rest are autonyms and must stay in their own language.
    if (langSel.options.length) langSel.options[0].textContent = msg('langAuto');

    unit = msg('unitPx');
    showWidth(pageOut, pageWidth.value);
    showWidth(twOut, twWidth.value);
    showWidth(fsOut, fsWidth.value);
  }

  var enabled = $('enabled');
  var flip = $('flip');
  var theater = $('theater');
  var divider = $('divider');
  var pageWidth = $('pageWidth');
  var twWidth = $('twWidth');
  var fsWidth = $('fsWidth');
  var pageOut = $('pageWidthOut');
  var twOut = $('twWidthOut');
  var fsOut = $('fsWidthOut');
  var langSel = $('lang');
  var gated = $('gated');
  var unit = 'px';

  [pageWidth, twWidth, fsWidth].forEach(function (r) {
    r.min = YTCHAT.MIN;
    r.max = YTCHAT.MAX;
    r.step = YTCHAT.STEP;
  });

  function showWidth(out, px) { out.textContent = px + ' ' + unit; }

  // Auto first, then the catalogues in the order i18n.js declares them.
  langSel.appendChild(new Option('', 'auto'));
  YTCHAT_LANGS.forEach(function (pair) {
    langSel.appendChild(new Option(pair[1], pair[0]));
  });

  try {
    $('version').textContent = 'v' + chrome.runtime.getManifest().version;
  } catch (e) { /* not fatal — the version line just stays empty */ }

  var coffee = $('coffee');
  if (COFFEE_URL) coffee.href = COFFEE_URL;
  else coffee.hidden = true;

  /* ---- state ---------------------------------------------------------- */

  function render(s) {
    enabled.checked = YTCHAT.isOn(s[YTCHAT.K.enabled]);
    flip.checked = YTCHAT.isOn(s[YTCHAT.K.flip]);
    theater.checked = YTCHAT.isOn(s[YTCHAT.K.theater]);
    divider.checked = YTCHAT.isOn(s[YTCHAT.K.divider]);

    var w = function (k) {
      return YTCHAT.clampWidth(s[k]) || Number(YTCHAT.DEF[k]);
    };
    pageWidth.value = w(YTCHAT.K.page);
    twWidth.value = w(YTCHAT.K.tw);
    fsWidth.value = w(YTCHAT.K.fs);

    langSel.value = YTCHAT_MESSAGES[s[YTCHAT.K.lang]] ? s[YTCHAT.K.lang] : 'auto';
    applyLanguage(langSel.value);

    if (enabled.checked) gated.removeAttribute('data-off');
    else gated.setAttribute('data-off', '');
  }

  function readAll(cb) {
    chrome.storage.local.get(YTCHAT.ALL_KEYS, function (got) {
      var s = {};
      YTCHAT.ALL_KEYS.forEach(function (k) {
        s[k] = got[k] === undefined ? YTCHAT.DEF[k] : got[k];
      });
      cb(s);
    });
  }

  var toastTimer = null;
  function toast() {
    var el = $('toast');
    el.textContent = msg('toastSaved');
    el.setAttribute('data-show', '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.removeAttribute('data-show'); }, 900);
  }

  function save(patch) {
    chrome.storage.local.set(patch, function () {
      if (!chrome.runtime.lastError) toast();
    });
  }

  function set(key, value) {
    var patch = {};
    patch[key] = String(value);
    save(patch);
  }

  /* ---- wiring ---------------------------------------------------------
     Switches commit on change. Sliders commit continuously — see bindRange. */

  enabled.addEventListener('change', function () {
    if (enabled.checked) gated.removeAttribute('data-off');
    else gated.setAttribute('data-off', '');
    set(YTCHAT.K.enabled, enabled.checked ? '1' : '0');
  });

  flip.addEventListener('change', function () {
    set(YTCHAT.K.flip, flip.checked ? '1' : '0');
  });

  theater.addEventListener('change', function () {
    set(YTCHAT.K.theater, theater.checked ? '1' : '0');
  });

  divider.addEventListener('change', function () {
    set(YTCHAT.K.divider, divider.checked ? '1' : '0');
  });

  langSel.addEventListener('change', function () {
    applyLanguage(langSel.value);
    set(YTCHAT.K.lang, langSel.value);
  });

  /* Sliders write while they move, so the page tracks them the way it tracks
     the divider being dragged — the whole point of a live preview is seeing
     the layout, not a number.

     Throttled to one write per animation frame. Without that a single drag
     fires ~40 input events, each one a storage write, an onChanged in every
     open YouTube tab and a relayout there. requestAnimationFrame bounds it to
     the display's refresh rate and drops the intermediate values.

     The toast stays on 'change' only. Firing it per frame would leave "Saved"
     permanently lit while dragging, which reads as a stuck UI. */
  function bindRange(input, out, key) {
    var pending = null;
    var frame = 0;

    function flush() {
      frame = 0;
      if (pending === null) return;
      var patch = {};
      patch[key] = String(pending);
      pending = null;
      chrome.storage.local.set(patch, function () { void chrome.runtime.lastError; });
    }

    input.addEventListener('input', function () {
      showWidth(out, input.value);
      var px = YTCHAT.clampWidth(input.value);
      if (px === null) return;
      pending = px;
      if (!frame) frame = requestAnimationFrame(flush);
    });

    input.addEventListener('change', function () {
      var px = YTCHAT.clampWidth(input.value);
      if (px !== null) set(key, px);
    });
  }

  bindRange(pageWidth, pageOut, YTCHAT.K.page);
  bindRange(twWidth, twOut, YTCHAT.K.tw);
  bindRange(fsWidth, fsOut, YTCHAT.K.fs);

  $('reset').addEventListener('click', function () {
    var patch = {};
    YTCHAT.ALL_KEYS.forEach(function (k) { patch[k] = YTCHAT.DEF[k]; });
    render(patch);
    save(patch);
  });

  /* A drag on the page itself, or another window's popup, can change these
     while this one is open. Re-render rather than let the two disagree. */
  chrome.storage.onChanged.addListener(function (changes, where) {
    if (where === 'local') readAll(render);
  });

  readAll(render);
})();
