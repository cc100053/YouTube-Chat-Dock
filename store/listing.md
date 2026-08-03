# Chrome Web Store listing — YouTube Chat Dock

Everything the Developer Dashboard asks for, in the order it asks for it.
Character counts are the store's own limits and were measured, not estimated.

---

## Store listing tab

### Name — 17 / 75 characters

```
YouTube Chat Dock
```

Descriptive, no YouTube logo or wordmark styling. A plain descriptive use of
the word "YouTube" in an extension name is the low-risk case; the trademark
exposure on this store lives in visual branding, so the icon and every
screenshot avoid the logo and the red-and-white scheme entirely.

### Short description — 129 / 132 characters

```
Turn live chat and chat replay into a resizable side panel. Drag the divider to resize. Works in true fullscreen. No permissions.
```

Alternate, 126 characters, if you'd rather lead with the layout than the drag:

```
Live chat and chat replay as a resizable side panel with a draggable divider. Works in page view, theater and true fullscreen.
```

Keep whichever you pick in sync with `description` in `manifest.json`, which
carries the same 132-character ceiling and has already been over it once.

### Detailed description

```
YouTube Chat Dock turns live chat and chat replay into a proper side panel —
one you can resize by dragging, that stays put in page view, theater mode and
true fullscreen.

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

PERMISSIONS: NONE

This extension requests no permissions at all. Installing it shows no warning
prompt, because there is nothing to warn you about.

• No data is collected, transmitted, or sold. Not anonymised, not aggregated.
• No network requests. No analytics, no telemetry, no remote configuration.
• No background service worker. Nothing runs when you are not on YouTube.
• Your chosen widths are stored locally in your own browser and never leave it.
• No account, no sign-in, no cloud sync.

HOW IT WORKS

One stylesheet and one small script, injected only on youtube.com. The
stylesheet does the layout; the script does nothing but move three CSS numbers
when you drag. There is no build step and no third-party dependency of any
kind — you can read the entire extension in about ten minutes.

The source is public and MIT licensed:
https://github.com/cc100053/YouTube-Chat-Dock

KNOWN LIMITATIONS

• Below a 1000px browser width, YouTube switches to a single-column layout
  where chat sits under the video. The extension deliberately does not apply
  there rather than fight YouTube's own responsive layout.
• Widths live in your browser's local storage, so clearing site data for
  youtube.com resets them to the defaults. This is a deliberate trade for
  requiring zero permissions.

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
panel beside the video player, with a draggable divider to set its width.
```

### Permission justifications

No permissions and no host permissions are declared, so the dashboard asks for
no justifications. `content_scripts.matches` is sufficient on its own, and
keeping it that way is a deliberate property of this listing — do not add a
permission without re-reading this note.

If asked to justify the content script itself:

```
The content script is the extension. It injects one stylesheet that re-lays out
YouTube's own chat and player elements, and one script that updates three CSS
custom properties as the user drags the divider. It reads no page content and
sends nothing anywhere.
```

### Data usage disclosures

Tick **none** of the collected-data types, then affirm all three certifications:

- I do not sell or transfer user data to third parties, outside of approved use cases — **true**
- I do not use or transfer user data for purposes unrelated to my item's single purpose — **true**
- I do not use or transfer user data to determine creditworthiness or for lending purposes — **true**

### Privacy policy URL

Required even at zero data collection. Use `store/PRIVACY.md` published at:

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
| Screenshot 5 | 1280×800 | `assets/screenshot-5-no-permissions.png` |
| Small promo tile | 440×280 | `assets/promo-small-440x280.png` |
| Marquee promo tile | 1440×560 | `assets/promo-marquee-1440x560.png` |

The packed extension icons (`icons/icon16.png`, `48`, `128`) are regenerated by
the same script and are **not** the same file as the store icon: they are RGBA
with transparent corners, because the 16px copy is the toolbar icon and sits on
the browser's own background. The store icon fills its frame instead.

Screenshot order is the pitch: what it is, what you do with it, the hard case
it survives, the option most people want, and then the reason to trust it.

---

## Traditional Chinese (zh-TW / zh-HK) listing

### 名稱

```
YouTube Chat Dock
```

### 簡短說明 — 51 / 132 characters

```
將直播聊天室與聊天重播變成可調整寬度的側邊欄，拖曳分隔線即可改變闊度，全螢幕一樣有效，不需要任何權限。
```

### 詳細說明

```
YouTube Chat Dock 將直播聊天室與聊天重播，變成一個真正的側邊欄 —— 可以拖曳調整寬度，
在一般播放頁、劇院模式同真正全螢幕都一樣有效。

它不是浮動視窗。影片會自動縮細去配合聊天室，所以聊天室永遠不會遮住影片，影片亦不會被裁切。

功能

• 拖曳分隔線調整聊天室闊度。一般模式同全螢幕分開記住各自的闊度。
• 雙擊分隔線回復預設闊度。
• 將滑鼠移到分隔線上，按切換鈕即可將聊天室搬到另一邊，選擇會被記住。
• 影片重溫的聊天重播，行為同直播聊天室完全一樣。
• 聊天室最窄可以收到 120px，訊息不會被切走。
• 完整支援由右至左的語言介面，聊天室會停在正確的一邊。

權限：完全沒有

本擴充功能不要求任何權限。安裝時不會出現權限警告，因為根本沒有東西需要警告。

• 不收集、不傳送、不出售任何資料。
• 沒有任何網絡連線，沒有分析、沒有追蹤。
• 沒有背景程序。不在 YouTube 時完全不會運行。
• 你設定的闊度只會儲存在你自己的瀏覽器內，永遠不會離開。
• 不需要帳號，不需要登入。

原始碼公開，採用 MIT 授權：
https://github.com/cc100053/YouTube-Chat-Dock

已知限制

• 瀏覽器闊度低於 1000px 時，YouTube 會切換成單欄版面，聊天室排在影片下方。本擴充功能
  在該情況下刻意不生效，以免與 YouTube 自己的響應式版面打架。
• 闊度儲存在瀏覽器的 local storage，所以清除 youtube.com 的網站資料會回復預設值。
  這是為了做到零權限而刻意作出的取捨。

本擴充功能與 YouTube 及 Google 沒有任何從屬、認可或贊助關係。
```

---

## Pre-submission checklist

- [ ] `version` in `manifest.json` bumped
- [ ] `description` in `manifest.json` matches the short description above and is ≤ 132 characters
- [ ] `permissions` and `host_permissions` still absent from `manifest.json`
- [ ] `node --check dock.js` passes
- [ ] `python3 -c "import json; json.load(open('manifest.json'))"` passes
- [ ] Loaded unpacked and verified on a live stream **and** a VOD with chat replay
- [ ] ZIP contains `manifest.json`, `dock.css`, `dock.js`, `icons/` — and nothing else
- [ ] `store/` and `.git/` excluded from the ZIP
- [ ] Privacy policy URL resolves publicly
