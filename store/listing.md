# Chrome Web Store listing — YouTube Chat Dock

Everything the Developer Dashboard asks for, in the order it asks for it.
Character counts are the store's own limits and were measured, not estimated.

Published at:
https://chromewebstore.google.com/detail/youtube-chat-dock/bkmbhlkcjbkjapbamkidacajjfhoiiam

This file stays the source of truth for listing copy — edit here, then copy
into the dashboard, rather than editing the dashboard directly and letting it
drift out of sync with the repo.

---

## Store listing tab

### Name — 53 / 75 characters (en)

```
YouTube Chat Dock — Side Panel for Live Chat & Replay
```

Do not edit this here either. Since v1.7.0 the manifest reads
`__MSG_extName__`, so the name is localised per store alongside the
description, and `store/package.sh` measures every locale against the 75-char
ceiling. The measured lengths are in the table under *Localised name and short
description* below.

The suffix was added in v1.7.0 for store search, which is largely keyword
matching weighted heavily toward the title. "YouTube Chat Dock" alone contains
none of the words anyone types — the queries this is trying to be found for are
"chat side by side", "chat next to video", "resize youtube chat",
"chat in fullscreen" and "theater mode chat". The brand token stays first so
the title still reads as a product name rather than a keyword list, which is
also what keeps it inside the store's policy on title stuffing.

The toolbar tooltip does **not** use this string. `action.default_title` reads a
separate `__MSG_extNameShort__` key, because a 53-character tooltip hanging off
the toolbar icon is absurd. The popup's own `<h1>` is unaffected either way — it
comes from the table in `i18n.js`, not from `_locales/`.

Descriptive, no YouTube logo or wordmark styling. A plain descriptive use of
the word "YouTube" in an extension name is the low-risk case; the trademark
exposure on this store lives in visual branding, so the icon and every
screenshot avoid the logo and the red-and-white scheme entirely.

### Short description — 114 / 132 characters (en)

```
Live chat side by side with the video: a resizable side panel for chat and replay, in theater mode and fullscreen.
```

Do not edit this here. Since v1.4.0 the manifest reads `__MSG_extDesc__`, so
the real string lives in `_locales/<lang>/messages.json` and the store pulls a
localised one per language. The 132-character ceiling applies to **every**
locale — Spanish measured 133 on the first pass and had to be shortened, so
re-run the length check in `store/package.sh` after touching any of them.

Rewritten in v1.7.0 to front-load the query language. The store truncates this
in results, so the words that matter go first, and "theater mode" was traded in
for "drag the divider" — the divider is the better feature but nobody searches
for it, and theater mode is a query with real intent behind it.

### Localised name and short description — measured

Both strings, in all twelve locales, as measured by `store/package.sh`. Neither
ceiling is a suggestion: the dashboard rejects the upload rather than truncating.

| Locale | Name (≤75) | Short description (≤132) |
|---|---|---|
| ar | 48 | 102 |
| de | 49 | 117 |
| en | 53 | 114 |
| es | 57 | 123 |
| fr | 58 | 124 |
| hi | 38 | 96 |
| ja | 34 | 52 |
| ko | 33 | 62 |
| pt_BR | 54 | 120 |
| ru | 39 | 100 |
| zh_CN | 27 | 39 |
| zh_TW | 28 | 42 |

French is the longest name at 58 and the longest description at 124, so it is
the locale that will break first if either string grows.

### Detailed description

The store surfaces only the **first two lines** in search results, so those two
lines carry the query language and not the product name — the name is already
on the row above them. The old opening spent both lines restating the title.

```
Put YouTube live chat side by side with the video: a resizable side panel for
live chat and chat replay that works in page view, theater mode and true
fullscreen, where YouTube hides chat entirely.

It is not a floating overlay. The video is resized to fit beside the chat, so
chat never covers the thing you came to watch, and the video is never cropped
to make room.

WHAT IT DOES

• Drag the divider to set the chat width. Page mode and fullscreen remember
  their widths separately, so going fullscreen doesn't undo your layout.
• Double-click the divider to snap back to the default.
• Hover the divider and click the toggle to move chat to the other side. The
  choice persists.
• Chat replay on VODs behaves exactly like live chat.
• Narrow chat all the way down to 120px without messages getting clipped.
• Right-to-left locales are handled properly — chat docks on the correct side
  and the divider flips with it.
• Theater mode is docked too. YouTube narrows the player there to reserve a
  side slot, then leaves it empty and drops chat underneath — this fills it.
• A settings popup in the toolbar: an on/off switch, all three widths, the
  side toggle, and a reset. Theater docking and the divider are always on.
• Pick your own interface language from 12, independently of your browser's.

ONE PERMISSION, AND NOTHING LEAVES YOUR BROWSER

The extension declares a single permission, "storage", and Chrome shows no
permission prompt for it on install. It exists for one reason: the settings
popup is a separate page and cannot otherwise reach the tab it is configuring.

• No data is collected, transmitted, or sold. Not anonymised, not aggregated.
• No network requests. No analytics, no telemetry, no remote configuration.
• No background service worker. Nothing runs when you are not on YouTube.
• Your settings are stored in your own browser and never leave the device.
• No account, no sign-in, no cloud sync.
• No host permissions. It can act on youtube.com and nowhere else.

HOW IT WORKS

One stylesheet and one small script, injected only on youtube.com. The
stylesheet does the layout; the script does nothing but move three CSS numbers
when you drag. There is no build step and no third-party dependency of any
kind — you can read the entire extension in about ten minutes.

Full feature list and FAQ:
https://cc100053.github.io/YouTube-Chat-Dock/

The source is public and MIT licensed:
https://github.com/cc100053/YouTube-Chat-Dock

KNOWN LIMITATIONS

• Below a 1000px browser width, YouTube switches to a single-column layout
  where chat sits under the video. The extension deliberately does not apply
  there rather than fight YouTube's own responsive layout.
• Widths are kept in your browser's local storage so they can be applied
  before the page paints, with no flicker. Clearing site data for youtube.com
  therefore resets them to the defaults.

Not affiliated with, endorsed by, or sponsored by YouTube or Google.
```

### Category

`Productivity` — secondary, if offered: `Tools`.

Not `Entertainment`. The value proposition is layout control while working or
watching, and Productivity is a far less crowded shelf for this.

### Language

`English (United States)`. A Traditional Chinese listing is drafted below;
add it under **Store listing → add language** once the English one is live.

---

## Privacy tab

### Single purpose description

```
Re-lays out YouTube's existing live chat and chat replay as a resizable side
panel beside the video player, in page view, theater mode and fullscreen, with
a draggable divider to set its width.
```

### Permission justifications

One permission, `storage`. No host permissions — `content_scripts.matches` is
sufficient on its own, and keeping it that way is still a deliberate property
of this listing.

`storage` justification:

```
The settings popup is an extension page and cannot write to youtube.com's own
storage. chrome.storage.local is the only channel through which a user's choice
in the popup — on/off, panel side, panel width — can reach the content script
that lays out the page. Nothing else is stored, and nothing is ever sent off
the device.
```

Content script justification, if asked:

```
The content script is the extension. It injects one stylesheet that re-lays out
YouTube's own chat and player elements, and one script that updates three CSS
custom properties as the user drags the divider. It reads no page content and
sends nothing anywhere.
```

Note that `storage` is not a warning-generating permission: Chrome still shows
no permission prompt on install. That is worth saying in the listing, and the
detailed description does — but say "one permission", never "zero", now that
this is declared.

### Data usage disclosures

Tick **none** of the collected-data types, then affirm all three certifications:

- I do not sell or transfer user data to third parties, outside of approved use cases — **true**
- I do not use or transfer user data for purposes unrelated to my item's single purpose — **true**
- I do not use or transfer user data to determine creditworthiness or for lending purposes — **true**

### Privacy policy URL

Required even though no data is collected. Use `store/PRIVACY.md` published at:

```
https://github.com/cc100053/YouTube-Chat-Dock/blob/main/store/PRIVACY.md
```

---

## Graphic assets

All generated by `store/make_assets.py`, all drawn rather than screenshotted.
That is deliberate: a real watch-page screenshot carries YouTube's logo,
wordmark and red-on-white scheme, which is exactly the trademark exposure this
listing avoids. Re-run the script to change any of them.

| Slot | Required size | File |
|---|---|---|
| Store icon | 128×128 | `assets/store-icon-128.png` |
| Screenshot 1 | 1280×800 | `assets/screenshot-1-side-panel.png` |
| Screenshot 2 | 1280×800 | `assets/screenshot-2-drag-to-resize.png` |
| Screenshot 3 | 1280×800 | `assets/screenshot-3-fullscreen.png` |
| Screenshot 4 | 1280×800 | `assets/screenshot-4-either-side.png` |
| Screenshot 5 | 1280×800 | `assets/screenshot-5-settings.png` |
| Small promo tile | 440×280 | `assets/promo-small-440x280.png` |
| Marquee promo tile | 1440×560 | `assets/promo-marquee-1440x560.png` |

The packed extension icons (`icons/icon16.png`, `48`, `128`) are regenerated by
the same script and are **not** the same file as the store icon: they are RGBA
with transparent corners, because the 16px copy is the toolbar icon and sits on
the browser's own background. The store icon fills its frame instead.

Screenshot order is the pitch: what it is, what you do with it, the hard case
it survives, the option most people want, and then the settings — which is also
where the privacy claims sit, since five slots is the store's maximum and the
popup earns one of them.

The popup in screenshot 5 is drawn to match the real thing, which was rendered
in Chrome in English, Traditional Chinese and Arabic first. The switch states
and the three slider values are what the popup shows at defaults.

---

## Traditional Chinese (zh-TW / zh-HK) listing

### 名稱 — 28 / 75 characters

Pulled from `_locales/zh_TW/messages.json`, like the English one.

```
YouTube Chat Dock — 直播聊天室側邊欄
```

### 簡短說明 — 42 / 132 characters

Pulled from `_locales/zh_TW/messages.json` at build time, not typed into the
dashboard. The old wording claimed "不需要任何權限", which stopped being true
in v1.4.0.

```
聊天室與影片並排：可調整寬度的直播聊天室與聊天重播側邊欄，劇院模式與全螢幕同樣有效。
```

### 詳細說明

```
讓直播聊天室與影片並排：可拖曳調整寬度的側邊欄，支援直播聊天與聊天重播，
在一般播放頁、劇院模式與真正的全螢幕都同樣有效 —— 全螢幕下 YouTube 原本
會完全隱藏聊天室。

它不是浮動視窗。影片會自動縮小以配合聊天室，因此聊天室不會遮住影片，影片也不會被裁切。

功能

• 拖曳分隔線調整聊天室寬度。一般模式、劇院模式與全螢幕分別記住各自的寬度。
• 雙擊分隔線即可回復預設寬度。
• 將滑鼠移至分隔線上，按下切換鈕即可將聊天室移至另一側，選擇會被記住。
• 影片重溫的聊天重播，行為與直播聊天室完全相同。
• 聊天室最窄可收至 120px，訊息不會被截斷。
• 完整支援由右至左的語言介面，聊天室會停靠在正確的一側。
• 劇院模式同樣停靠。YouTube 在該模式下會收窄播放器以預留一格側邊空位，卻將該處留空
  並把聊天室排到影片下方 —— 本擴充功能會填補該空位。
• 工具列設定面板：啟用開關、三種寬度、左右切換、一鍵回復預設值。劇院模式停靠與
  分隔線一律啟用。
• 介面語言可自行從 12 種語言中選擇，不必跟隨瀏覽器。

只有一個權限，而且沒有任何資料離開你的瀏覽器

本擴充功能只宣告一個權限 storage，安裝時 Chrome 不會顯示任何權限警告。它存在的
唯一原因是：設定面板屬於獨立頁面，否則無法將你的選擇傳遞至正在瀏覽的分頁。

• 不收集、不傳送、不出售任何資料。
• 沒有任何網路連線，沒有分析，沒有追蹤。
• 沒有背景程序。不在 YouTube 時完全不會執行。
• 你的設定僅儲存於你自己的瀏覽器內，永遠不會離開裝置。
• 不需要帳號，不需要登入。
• 沒有 host 權限，僅能在 youtube.com 上運作。

完整功能說明與常見問題：
https://cc100053.github.io/YouTube-Chat-Dock/

原始碼公開，採用 MIT 授權：
https://github.com/cc100053/YouTube-Chat-Dock

已知限制

• 瀏覽器寬度低於 1000px 時，YouTube 會切換為單欄版面，將聊天室排在影片下方。本擴充
  功能在該情況下刻意不生效，以免與 YouTube 自身的響應式版面相衝突。
• 寬度儲存於瀏覽器的 local storage，目的是在頁面繪製前即套用以避免閃動。因此清除
  youtube.com 的網站資料會回復預設值。

本擴充功能與 YouTube 及 Google 沒有任何從屬、認可或贊助關係。
```

---

## Pre-submission checklist

- [ ] `version` in `manifest.json` bumped
- [ ] every `extDesc` in `_locales/*/messages.json` is ≤ 132 characters and
      every `extName` is ≤ 75 — `store/package.sh` measures both and fails
- [ ] `extNameShort` present in every locale, or the toolbar tooltip inherits
      the keyword-loaded store title
- [ ] `docs/index.html` FAQ JSON-LD still matches the visible answers —
      `store/package.sh` checks this too
- [ ] every language in `i18n.js` defines the identical key set (21 keys as of
      v1.6.0 — verify with a Node one-liner over `YTCHAT_MESSAGES`, since
      `store/package.sh` only parses the two-string `_locales/` files)
- [ ] `permissions` is still `["storage"]` and nothing more; `host_permissions` still absent
- [ ] `node --check` passes on `dock.js`, `settings.js` and `popup.js`
- [ ] `python3 -c "import json; json.load(open('manifest.json'))"` passes
- [ ] Loaded unpacked and verified on a live stream **and** a VOD with chat replay
- [ ] ZIP contains `manifest.json`, `dock.css`, `dock.js`, `settings.js`,
      `i18n.js`, `popup.{html,css,js}`, `_locales/`, `icons/`, `LICENSE` — and
      nothing else
- [ ] Popup opened once per layout direction (an LTR locale and `ar`), and its
      height confirmed under Chrome's 600px cap in the longest language
- [ ] `COFFEE_URL` set in `popup.js` — `store/package.sh` refuses to build otherwise
- [ ] Theater mode checked on a live stream: chat beside the video, video uncropped
- [ ] `store/` and `.git/` excluded from the ZIP
- [ ] Privacy policy URL resolves publicly
