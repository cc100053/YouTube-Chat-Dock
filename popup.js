/* =============================================================
   YouTube Chat Dock — settings popup

   The popup writes chrome.storage.local and nothing else. It
   cannot touch youtube.com's localStorage: that origin belongs
   to the page, not to this extension page. dock.js owns the
   mirror in the other direction — see the comment there.
   ============================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var msg = function (k) { return chrome.i18n.getMessage(k) || ''; };

  /* ---- localisation ---------------------------------------------------
     Filled from chrome.i18n rather than written into popup.html, so there
     is no English left visible if a locale is missing a key — the fallback
     to _locales/en happens inside getMessage, uniformly. */
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.documentElement.dir = msg('@@bidi_dir') || 'ltr';
  document.title = msg('extName');

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-i18n]'),
    function (el) { el.textContent = msg(el.dataset.i18n); }
  );

  var enabled = $('enabled');
  var flip = $('flip');
  var divider = $('divider');
  var pageWidth = $('pageWidth');
  var fsWidth = $('fsWidth');
  var pageOut = $('pageWidthOut');
  var fsOut = $('fsWidthOut');
  var gated = $('gated');

  [pageWidth, fsWidth].forEach(function (r) {
    r.min = YTCHAT.MIN;
    r.max = YTCHAT.MAX;
    r.step = YTCHAT.STEP;
  });

  var unit = msg('unitPx');
  function showWidth(out, px) { out.textContent = px + ' ' + unit; }

  /* ---- state ---------------------------------------------------------- */

  function render(s) {
    enabled.checked = YTCHAT.isOn(s[YTCHAT.K.enabled]);
    flip.checked = YTCHAT.isOn(s[YTCHAT.K.flip]);
    divider.checked = YTCHAT.isOn(s[YTCHAT.K.divider]);

    var pw = YTCHAT.clampWidth(s[YTCHAT.K.page]) || Number(YTCHAT.DEF[YTCHAT.K.page]);
    var fw = YTCHAT.clampWidth(s[YTCHAT.K.fs]) || Number(YTCHAT.DEF[YTCHAT.K.fs]);
    pageWidth.value = pw;
    fsWidth.value = fw;
    showWidth(pageOut, pw);
    showWidth(fsOut, fw);

    if (enabled.checked) gated.removeAttribute('data-off');
    else gated.setAttribute('data-off', '');
  }

  function load() {
    chrome.storage.local.get(YTCHAT.ALL_KEYS, function (got) {
      var s = {};
      YTCHAT.ALL_KEYS.forEach(function (k) {
        s[k] = got[k] === undefined ? YTCHAT.DEF[k] : got[k];
      });
      render(s);
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

  function save(patch, quiet) {
    chrome.storage.local.set(patch, function () {
      if (chrome.runtime.lastError) return;
      if (!quiet) toast();
    });
  }

  /* ---- wiring ---------------------------------------------------------
     Switches commit on change. Sliders update their readout on input but
     only commit on change (pointer release), so a single drag writes once
     instead of ~40 times. */

  enabled.addEventListener('change', function () {
    var patch = {};
    patch[YTCHAT.K.enabled] = enabled.checked ? '1' : '0';
    if (enabled.checked) gated.removeAttribute('data-off');
    else gated.setAttribute('data-off', '');
    save(patch);
  });

  flip.addEventListener('change', function () {
    var patch = {};
    patch[YTCHAT.K.flip] = flip.checked ? '1' : '0';
    save(patch);
  });

  divider.addEventListener('change', function () {
    var patch = {};
    patch[YTCHAT.K.divider] = divider.checked ? '1' : '0';
    save(patch);
  });

  function bindRange(input, out, key) {
    input.addEventListener('input', function () {
      showWidth(out, input.value);
    });
    input.addEventListener('change', function () {
      var px = YTCHAT.clampWidth(input.value);
      if (px === null) return;
      var patch = {};
      patch[key] = String(px);
      save(patch);
    });
  }

  bindRange(pageWidth, pageOut, YTCHAT.K.page);
  bindRange(fsWidth, fsOut, YTCHAT.K.fs);

  $('reset').addEventListener('click', function () {
    var patch = {};
    YTCHAT.ALL_KEYS.forEach(function (k) { patch[k] = YTCHAT.DEF[k]; });
    render(patch);
    save(patch);
  });

  /* Another window's popup, or a drag on the page itself, can change these
     while this popup is open. Re-render rather than let the two disagree. */
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;
    chrome.storage.local.get(YTCHAT.ALL_KEYS, function (got) {
      var s = {};
      YTCHAT.ALL_KEYS.forEach(function (k) {
        s[k] = got[k] === undefined ? YTCHAT.DEF[k] : got[k];
      });
      render(s);
    });
  });

  load();
})();
