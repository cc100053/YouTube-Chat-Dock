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

     Your Buy Me a Coffee (or Ko-fi, or GitHub Sponsors) page. Must be an
     absolute https URL, e.g. 'https://buymeacoffee.com/yourname'.

     While it is unset the link is hidden rather than rendered dead — a donate
     button that 404s is worse than no donate button, and a *guessed* donation
     URL is worse still, because the money would go to whoever does own it.

     The packaging script refuses to build the upload ZIP while this is unset
     or malformed, so neither can reach the store by accident.
     ------------------------------------------------------------------ */
  var COFFEE_URL = 'https://ko-fi.com/hangyodev';

  /* ------------------------------------------------------------------
     SET THIS BEFORE PUBLISHING.

     The feedback forms — hosted Tally forms, one per language. Absolute
     https URLs.

     A hosted form rather than the GitHub issue tracker because the people
     with the most ordinary complaints are YouTube viewers, not developers,
     and requiring an account filters out exactly the feedback worth having.
     The GitHub link stays in the nav below for the ones who prefer it.

     Three forms rather than one, because Tally has no multi-language forms:
     its language setting translates the submit button and validation text
     and nothing an author writes. A form is therefore one language, and the
     only way to ask a Japanese user a question in Japanese is a second form.

     Nothing is sent from the popup. The button is a plain link: the request
     happens in the tab Chrome opens, only after the user clicks, which is
     what keeps "the extension makes no network requests" true of the
     extension itself.

     An unset `en` leaves the button hidden rather than dead, same as
     COFFEE_URL. The other two are optional: an unset one falls back to `en`
     rather than hiding, because a form in the wrong language still collects
     the report, and no button collects nothing.
     ------------------------------------------------------------------ */
  var FEEDBACK_URLS = {
    en: '',
    zh_TW: '',
    ja: ''
  };

  /* zh_CN is routed to the Traditional form, not to English. A Simplified
     reader gets far more from 繁體中文 than from English, even unconverted;
     the reverse of the usual fallback logic, and deliberate. Delete this line
     to send them to the English form instead. */
  FEEDBACK_URLS.zh_CN = FEEDBACK_URLS.zh_TW;

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
    if (langSel.options.length) {
      langSel.options[0].textContent = AUTO_MARK + '\u00A0 ' + msg('langAuto');
    }

    // The feedback URL carries the resolved language, so it is stale until
    // this runs \u2014 see setFeedbackHref.
    setFeedbackHref();

    unit = msg('unitPx');
    showWidth(pageOut, pageWidth.value);
    showWidth(twOut, twWidth.value);
    showWidth(fsOut, fsWidth.value);
  }

  /* Theater docking and the drag divider are always on and have no controls
     here any more. Their keys still exist and dock.js still honours them, so
     they must NOT be referenced in this file — $('theater') returns null now,
     and calling addEventListener on it threw during init, which aborted the
     whole popup and rendered it blank. */
  var enabled = $('enabled');
  var flip = $('flip');
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

  /* Auto first, then the catalogues in the order i18n.js declares them.
     The flag is a prefix on the autonym, never a replacement for it — on
     Windows the flag falls back to two plain letters, so the autonym is what
     has to carry the meaning. */
  var AUTO_MARK = '\uD83C\uDF10';   // globe, for the auto entry

  langSel.appendChild(new Option('', 'auto'));
  YTCHAT_LANGS.forEach(function (l) {
    langSel.appendChild(new Option(l[2] + '\u00A0 ' + l[1], l[0]));
  });

  try {
    $('version').textContent = 'v' + chrome.runtime.getManifest().version;
  } catch (e) { /* not fatal — the version line just stays empty */ }

  /* Absolute https only. A bare "buymeacoffee.com/name" would pass a
     non-empty check and then resolve against chrome-extension://<id>/, giving
     a link that looks fine in the popup and 404s on click. Anything that is
     not a valid https URL leaves the button hidden. */
  /* The review page lives at a URL containing the extension's id.

     A store-installed copy reports its own id, and that is preferred: it
     cannot go stale, whatever happens to the constant below. Chrome injects
     update_url into the manifest only for store-installed copies, which is
     how those are told apart.

     An unpacked development copy has neither, and used to hide the link
     entirely. That meant the control could never be seen while working on
     the popup — it was reported as having "vanished unexpectedly", and the
     answer was that in a development build it had never once been visible.
     Since the listing is published, its id is fixed and public (it is in the
     store URL), so a dev copy can point at the real listing instead of
     hiding. The link now has no hidden path at all. */
  var STORE_ID = 'bkmbhlkcjbkjapbamkidacajjfhoiiam';
  var rate = $('rate');
  var rateId = STORE_ID;
  try {
    var mf = chrome.runtime.getManifest();
    if (mf && mf.update_url && chrome.runtime.id) rateId = chrome.runtime.id;
  } catch (e) { /* orphaned context — the published id is still correct */ }
  rate.href = 'https://chromewebstore.google.com/detail/' + rateId + '/reviews';

  var coffee = $('coffee');
  var coffeeOk = false;
  try {
    coffeeOk = !!COFFEE_URL && new URL(COFFEE_URL).protocol === 'https:';
  } catch (e) {
    coffeeOk = false;
  }
  if (coffeeOk) coffee.href = COFFEE_URL;
  else coffee.hidden = true;

  /* Version and UI language ride along as query params, because the first
     question every bug report needs answered is "which version, which
     language" and asking costs a round trip that most reporters never make.
     Both are already visible in the popup; neither identifies anyone.

     Appended with URLSearchParams on the parsed URL so a form URL that
     already carries its own query (Google Forms' ?usp=..., Tally's hidden
     fields) keeps it instead of being truncated by a naive '?' + params.

     Rebuilt on every applyLanguage rather than once at init: `lang` is still
     the 'en' default here, because the stored preference does not arrive
     until readAll's callback. Setting the href once sent every report from
     every locale in as English. */
  function setFeedbackHref() {
    var el = $('feedback');
    if (!el) return;
    try {
      var fu = new URL(FEEDBACK_URLS[lang] || FEEDBACK_URLS.en);
      if (fu.protocol !== 'https:') throw 0;
      fu.searchParams.set('v', chrome.runtime.getManifest().version);
      fu.searchParams.set('lang', lang);
      el.href = fu.href;
      el.hidden = false;
    } catch (e) {
      el.removeAttribute('href');
      el.hidden = true;
    }
  }
  setFeedbackHref();

  /* ---- state ---------------------------------------------------------- */

  function render(s) {
    enabled.checked = YTCHAT.isOn(s[YTCHAT.K.enabled]);
    flip.checked = YTCHAT.isOn(s[YTCHAT.K.flip]);

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
      if (chrome.runtime.lastError) return;
      var s = {};
      YTCHAT.ALL_KEYS.forEach(function (k) {
        s[k] = got[k] === undefined ? YTCHAT.DEF[k] : got[k];
      });
      cb(s);
    });
  }

  /* This popup is itself a writer, and onChanged fires for its own writes —
     including one per animation frame while a slider is dragged. Re-rendering
     on that echo re-labelled every string in the UI ~60 times a second and
     wrote back into the range input the user still had hold of. Remember what
     we wrote and ignore the echo; a change from anywhere else still renders. */
  var selfWrites = Object.create(null);

  function remember(patch) {
    Object.keys(patch).forEach(function (k) { selfWrites[k] = String(patch[k]); });
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
    remember(patch);
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
      remember(patch);
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
    if (where !== 'local') return;
    var foreign = false;
    Object.keys(changes).forEach(function (k) {
      var v = changes[k].newValue;
      if (selfWrites[k] !== undefined && String(v) === selfWrites[k]) return;
      foreign = true;
    });
    if (foreign) readAll(render);
  });

  readAll(render);
})();
