/* =============================================================
   YouTube Chat Dock — UI strings

   NOT chrome.i18n. chrome.i18n always resolves to the browser's
   UI language and offers no way to override it at runtime, so a
   user-selectable language is impossible with it. These strings
   are therefore a plain table, looked up against a language the
   user can choose in the popup.

   chrome.i18n and _locales/ are still used, for exactly two
   strings — the extension name and description — because those
   are read by Chrome and by the Web Store listing, not by us.

   Loaded into both worlds, like settings.js: second content
   script, and a plain script in popup.html.
   ============================================================= */
/* [code, autonym, flag].

   Flags are a request, not a recommendation: a language is not a country, and
   the mapping is arbitrary for several of these — es is spoken far beyond ES,
   ar beyond SA, en beyond US. They are decoration on top of the autonym,
   which is what actually identifies the entry.

   They also degrade differently per platform: Windows has no glyphs for
   regional-indicator pairs and renders the two letters instead ("TW"), which
   is legible but not a flag. macOS and Linux show the flag. */
var YTCHAT_LANGS = [
  ["en",    "English", "🇺🇸"],
  ["zh_TW", "繁體中文", "🇹🇼"],
  ["zh_CN", "简体中文", "🇨🇳"],
  ["ja",    "日本語", "🇯🇵"],
  ["ko",    "한국어", "🇰🇷"],
  ["es",    "Español", "🇪🇸"],
  ["pt_BR", "Português (BR)", "🇧🇷"],
  ["fr",    "Français", "🇫🇷"],
  ["de",    "Deutsch", "🇩🇪"],
  ["ru",    "Русский", "🇷🇺"],
  ["ar",    "العربية", "🇸🇦"],
  ["hi",    "हिन्दी", "🇮🇳"],
];

var YTCHAT_MESSAGES = {
  "en": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "Enable on YouTube",
    "optEnabledHint": "Turn the panel off without uninstalling.",
    "optSwap": "Chat on the other side",
    "optPageWidth": "Width in page view",
    "optTheaterWidth": "Width in theater mode",
    "optFsWidth": "Width in fullscreen",
    "unitPx": "px",
    "secGeneral": "General",
    "secLayout": "Layout",
    "optLanguage": "Language",
    "langAuto": "Auto (browser language)",
    "btnReset": "Reset to defaults",
    "btnFeedback": "Send feedback",
    "toastSaved": "Saved",
    "linkStar": "Star me on GitHub",
    "linkRate": "Rate on the Web Store",
    "dividerTitle": "Drag or press arrow keys to resize chat · double-click to reset",
    "dividerAria": "Resize chat panel",
    "flipAria": "Move chat to the other side",
    "linkCoffee": "Buy me a coffee",
  },
  "zh_TW": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "在 YouTube 上啟用",
    "optEnabledHint": "無需解除安裝即可暫時關閉。",
    "optSwap": "將聊天室移至另一側",
    "optPageWidth": "一般播放頁寬度",
    "optTheaterWidth": "劇院模式寬度",
    "optFsWidth": "全螢幕寬度",
    "unitPx": "px",
    "secGeneral": "一般",
    "secLayout": "版面",
    "optLanguage": "語言",
    "langAuto": "自動（跟隨瀏覽器）",
    "btnReset": "回復預設值",
    "btnFeedback": "意見回饋",
    "toastSaved": "已儲存",
    "linkStar": "在 GitHub 給我一顆星",
    "linkRate": "在 Web Store 給評分",
    "dividerTitle": "拖曳或按方向鍵調整聊天室寬度 · 雙擊回復預設",
    "dividerAria": "調整聊天室寬度",
    "flipAria": "將聊天室移至另一側",
    "linkCoffee": "請我喝杯咖啡",
  },
  "zh_CN": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "在 YouTube 上启用",
    "optEnabledHint": "无需卸载即可暂时关闭。",
    "optSwap": "将聊天移至另一侧",
    "optPageWidth": "普通播放页宽度",
    "optTheaterWidth": "剧院模式宽度",
    "optFsWidth": "全屏宽度",
    "unitPx": "px",
    "secGeneral": "常规",
    "secLayout": "布局",
    "optLanguage": "语言",
    "langAuto": "自动（跟随浏览器）",
    "btnReset": "恢复默认值",
    "btnFeedback": "反馈建议",
    "toastSaved": "已保存",
    "linkStar": "在 GitHub 给我一颗星",
    "linkRate": "在 Web Store 评分",
    "dividerTitle": "拖动或按方向键调整聊天宽度 · 双击恢复默认",
    "dividerAria": "调整聊天面板宽度",
    "flipAria": "将聊天移至另一侧",
    "linkCoffee": "请我喝杯咖啡",
  },
  "ja": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "YouTube で有効にする",
    "optEnabledHint": "アンインストールせずに一時的に無効化できます。",
    "optSwap": "チャットを反対側に",
    "optPageWidth": "通常表示での幅",
    "optTheaterWidth": "シアターモードでの幅",
    "optFsWidth": "全画面での幅",
    "unitPx": "px",
    "secGeneral": "一般",
    "secLayout": "レイアウト",
    "optLanguage": "言語",
    "langAuto": "自動（ブラウザの言語）",
    "btnReset": "既定値に戻す",
    "btnFeedback": "フィードバック",
    "toastSaved": "保存しました",
    "linkStar": "GitHub でスターをつける",
    "linkRate": "ウェブストアで評価",
    "dividerTitle": "ドラッグまたは矢印キーで幅を調整 · ダブルクリックで既定に戻す",
    "dividerAria": "チャットパネルの幅を変更",
    "flipAria": "チャットを反対側に移動",
    "linkCoffee": "コーヒーを奢る",
  },
  "ko": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "YouTube에서 사용",
    "optEnabledHint": "제거하지 않고 잠시 끌 수 있습니다.",
    "optSwap": "채팅을 반대쪽에",
    "optPageWidth": "일반 보기 너비",
    "optTheaterWidth": "극장 모드 너비",
    "optFsWidth": "전체화면 너비",
    "unitPx": "px",
    "secGeneral": "일반",
    "secLayout": "레이아웃",
    "optLanguage": "언어",
    "langAuto": "자동 (브라우저 언어)",
    "btnReset": "기본값으로 되돌리기",
    "btnFeedback": "의견 보내기",
    "toastSaved": "저장됨",
    "linkStar": "GitHub에서 스타 주기",
    "linkRate": "웹 스토어에서 평가",
    "dividerTitle": "끌거나 화살표 키로 채팅 너비 조절 · 두 번 클릭하면 기본값",
    "dividerAria": "채팅 패널 크기 조절",
    "flipAria": "채팅을 반대쪽으로 이동",
    "linkCoffee": "커피 한 잔 사주기",
  },
  "es": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "Activar en YouTube",
    "optEnabledHint": "Desactiva el panel sin desinstalar.",
    "optSwap": "Chat en el otro lado",
    "optPageWidth": "Ancho en vista normal",
    "optTheaterWidth": "Ancho en modo cine",
    "optFsWidth": "Ancho en pantalla completa",
    "unitPx": "px",
    "secGeneral": "General",
    "secLayout": "Diseño",
    "optLanguage": "Idioma",
    "langAuto": "Automático (idioma del navegador)",
    "btnReset": "Restablecer valores",
    "btnFeedback": "Enviar comentarios",
    "toastSaved": "Guardado",
    "linkStar": "Dame una estrella en GitHub",
    "linkRate": "Valóralo en la Web Store",
    "dividerTitle": "Arrastra o usa las flechas para redimensionar · doble clic para restablecer",
    "dividerAria": "Redimensionar el panel de chat",
    "flipAria": "Mover el chat al otro lado",
    "linkCoffee": "Invítame a un café",
  },
  "pt_BR": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "Ativar no YouTube",
    "optEnabledHint": "Desative o painel sem desinstalar.",
    "optSwap": "Chat do outro lado",
    "optPageWidth": "Largura na visualização normal",
    "optTheaterWidth": "Largura no modo cinema",
    "optFsWidth": "Largura em tela cheia",
    "unitPx": "px",
    "secGeneral": "Geral",
    "secLayout": "Layout",
    "optLanguage": "Idioma",
    "langAuto": "Automático (idioma do navegador)",
    "btnReset": "Restaurar padrões",
    "btnFeedback": "Enviar feedback",
    "toastSaved": "Salvo",
    "linkStar": "Dê uma estrela no GitHub",
    "linkRate": "Avalie na Web Store",
    "dividerTitle": "Arraste ou use as setas para redimensionar · clique duplo para restaurar",
    "dividerAria": "Redimensionar o painel de chat",
    "flipAria": "Mover o chat para o outro lado",
    "linkCoffee": "Me pague um café",
  },
  "fr": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "Activer sur YouTube",
    "optEnabledHint": "Désactive le panneau sans désinstaller.",
    "optSwap": "Chat de l'autre côté",
    "optPageWidth": "Largeur en vue normale",
    "optTheaterWidth": "Largeur en mode cinéma",
    "optFsWidth": "Largeur en plein écran",
    "unitPx": "px",
    "secGeneral": "Général",
    "secLayout": "Disposition",
    "optLanguage": "Langue",
    "langAuto": "Automatique (langue du navigateur)",
    "btnReset": "Réinitialiser",
    "btnFeedback": "Envoyer un avis",
    "toastSaved": "Enregistré",
    "linkStar": "Mettez une étoile sur GitHub",
    "linkRate": "Notez sur le Web Store",
    "dividerTitle": "Glisser ou flèches pour redimensionner · double-clic pour réinitialiser",
    "dividerAria": "Redimensionner le panneau de chat",
    "flipAria": "Déplacer le chat de l'autre côté",
    "linkCoffee": "Offrez-moi un café",
  },
  "de": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "Auf YouTube aktivieren",
    "optEnabledHint": "Panel abschalten, ohne zu deinstallieren.",
    "optSwap": "Chat auf der anderen Seite",
    "optPageWidth": "Breite in der Seitenansicht",
    "optTheaterWidth": "Breite im Kinomodus",
    "optFsWidth": "Breite im Vollbild",
    "unitPx": "px",
    "secGeneral": "Allgemein",
    "secLayout": "Layout",
    "optLanguage": "Sprache",
    "langAuto": "Automatisch (Browsersprache)",
    "btnReset": "Auf Standard zurücksetzen",
    "btnFeedback": "Feedback senden",
    "toastSaved": "Gespeichert",
    "linkStar": "Gib mir einen Stern auf GitHub",
    "linkRate": "Im Web Store bewerten",
    "dividerTitle": "Ziehen oder Pfeiltasten zum Anpassen · Doppelklick setzt zurück",
    "dividerAria": "Chat-Panel-Breite ändern",
    "flipAria": "Chat auf die andere Seite verschieben",
    "linkCoffee": "Spendier mir einen Kaffee",
  },
  "ru": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "Включить на YouTube",
    "optEnabledHint": "Отключить панель без удаления расширения.",
    "optSwap": "Чат с другой стороны",
    "optPageWidth": "Ширина в обычном режиме",
    "optTheaterWidth": "Ширина в режиме театра",
    "optFsWidth": "Ширина в полноэкранном режиме",
    "unitPx": "px",
    "secGeneral": "Общие",
    "secLayout": "Макет",
    "optLanguage": "Язык",
    "langAuto": "Автоматически (язык браузера)",
    "btnReset": "Сбросить настройки",
    "btnFeedback": "Оставить отзыв",
    "toastSaved": "Сохранено",
    "linkStar": "Поставьте звезду на GitHub",
    "linkRate": "Оценить в Web Store",
    "dividerTitle": "Потяните или используйте стрелки · двойной клик — сброс",
    "dividerAria": "Изменить ширину панели чата",
    "flipAria": "Переместить чат на другую сторону",
    "linkCoffee": "Купить мне кофе",
  },
  "ar": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "تفعيل على YouTube",
    "optEnabledHint": "أوقف اللوحة دون إلغاء التثبيت.",
    "optSwap": "الدردشة على الجانب الآخر",
    "optPageWidth": "العرض في العرض العادي",
    "optTheaterWidth": "العرض في وضع المسرح",
    "optFsWidth": "العرض في وضع ملء الشاشة",
    "unitPx": "px",
    "secGeneral": "عام",
    "secLayout": "التخطيط",
    "optLanguage": "اللغة",
    "langAuto": "تلقائي (لغة المتصفح)",
    "btnReset": "إعادة الضبط الافتراضي",
    "btnFeedback": "إرسال ملاحظات",
    "toastSaved": "تم الحفظ",
    "linkStar": "امنحني نجمة على GitHub",
    "linkRate": "قيّمه في متجر الويب",
    "dividerTitle": "اسحب أو استخدم مفاتيح الأسهم لتغيير العرض · انقر مرتين لإعادة الضبط",
    "dividerAria": "تغيير عرض لوحة الدردشة",
    "flipAria": "نقل الدردشة إلى الجانب الآخر",
    "linkCoffee": "ادعُني إلى قهوة",
  },
  "hi": {
    "extName": "YouTube Chat Dock",
    "optEnabled": "YouTube पर सक्षम करें",
    "optEnabledHint": "अनइंस्टॉल किए बिना पैनल बंद करें।",
    "optSwap": "चैट दूसरी ओर",
    "optPageWidth": "पेज व्यू में चौड़ाई",
    "optTheaterWidth": "थिएटर मोड में चौड़ाई",
    "optFsWidth": "पूर्ण स्क्रीन में चौड़ाई",
    "unitPx": "px",
    "secGeneral": "सामान्य",
    "secLayout": "लेआउट",
    "optLanguage": "भाषा",
    "langAuto": "स्वतः (ब्राउज़र भाषा)",
    "btnReset": "डिफ़ॉल्ट पर रीसेट करें",
    "btnFeedback": "सुझाव भेजें",
    "toastSaved": "सहेजा गया",
    "linkStar": "GitHub पर स्टार दें",
    "linkRate": "वेब स्टोर पर रेट करें",
    "dividerTitle": "खींचें या तीर कुंजियों से चौड़ाई बदलें · रीसेट के लिए डबल-क्लिक",
    "dividerAria": "चैट पैनल का आकार बदलें",
    "flipAria": "चैट को दूसरी ओर ले जाएँ",
    "linkCoffee": "मुझे कॉफ़ी पिलाएँ",
  },
};

/* Chrome hands back tags like "zh-TW", "zh-HK", "pt-PT", "en-GB". Map them
   onto the twelve catalogues we actually have, rather than dropping to
   English on a near miss: zh-HK is far better served by zh_TW than by en. */
var YTCHAT_LANG_ALIAS = {
  zh: 'zh_CN', zh_hans: 'zh_CN', zh_sg: 'zh_CN',
  zh_hant: 'zh_TW', zh_hk: 'zh_TW', zh_mo: 'zh_TW',
  pt: 'pt_BR', pt_pt: 'pt_BR',
};

function ytchatResolveLang(pref, uiLang) {
  if (pref && pref !== 'auto' && YTCHAT_MESSAGES[pref]) return pref;
  var tag = String(uiLang || 'en').replace(/-/g, '_');
  var lower = tag.toLowerCase();
  var byExact = Object.keys(YTCHAT_MESSAGES).filter(function (k) {
    return k.toLowerCase() === lower;
  })[0];
  if (byExact) return byExact;
  if (YTCHAT_LANG_ALIAS[lower]) return YTCHAT_LANG_ALIAS[lower];
  var base = lower.split('_')[0];
  if (YTCHAT_LANG_ALIAS[base]) return YTCHAT_LANG_ALIAS[base];
  var byBase = Object.keys(YTCHAT_MESSAGES).filter(function (k) {
    return k.toLowerCase().split('_')[0] === base;
  })[0];
  return byBase || 'en';
}

/* Arabic is the only right-to-left catalogue here. Kept as a list rather than
   a flag on each entry so adding he/fa later is one edit. */
var YTCHAT_RTL = ['ar'];

function ytchatIsRtl(lang) { return YTCHAT_RTL.indexOf(lang) !== -1; }

function ytchatMsg(key, lang) {
  var table = YTCHAT_MESSAGES[lang] || YTCHAT_MESSAGES.en;
  var v = table[key];
  return v === undefined ? (YTCHAT_MESSAGES.en[key] || '') : v;
}
