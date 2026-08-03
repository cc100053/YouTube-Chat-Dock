# YouTube Chat Dock

A Chrome extension that turns YouTube's live chat and chat replay into a **fixed, resizable right-side panel** — with a draggable divider that works in page view, theater mode, and true fullscreen.

Not a floating overlay. The video is resized to fit beside the chat, never covered by it.

- **Drag the divider** to resize. Page mode and fullscreen remember separate widths.
- **Double-click** the divider to reset.
- **Hover the divider and click ⇄** to move chat to the other side. The choice persists.
- **Chat replay** on VODs works exactly like live chat.
- **RTL locales** supported — chat docks left, and the divider flips with it.
- **Theater mode** docks chat beside the video too, filling the empty slot
  YouTube leaves there.
- **Settings popup** in the toolbar: on/off, all three widths, side, reset —
  and a language picker, because the browser's language is not always yours.
  The width sliders preview live, exactly like dragging the divider.
- **One permission** (`storage`), no host permissions, no network requests, no tracking.

## Install

Until it's on the Chrome Web Store:

1. Clone or download this repo
2. Go to `chrome://extensions/` and enable **Developer mode**
3. **Load unpacked** → select the repo folder
4. Reload YouTube

## Configuration

Click the toolbar icon for the settings popup, or just drag the divider. Both
write the same five values, so they never disagree.

The bounds live in `settings.js`, which is loaded by both the content script
and the popup so there is one definition rather than two copies:

```js
MIN: 120,             // narrowest draggable width
MAX: 1100,            // widest
KEEP_FOR_VIDEO: 480,  // player never squeezed below this
TOP_GAP: 72,          // gap under the masthead in page mode
```

Widths are clamped against the *current* viewport on every load, so a width
saved on a large monitor won't leave a sliver of video on a laptop.

Defaults (440px page / 560px fullscreen) live in `settings.js`, mirrored as
static fallbacks in `dock.css` under `:root`.

### Language

The popup has a language picker, so the twelve UI languages are a plain table
in `i18n.js` rather than `chrome.i18n`. `chrome.i18n` always resolves to the
browser's UI language and offers no runtime override, which makes a picker
impossible with it. `_locales/` still exists, holding exactly two strings —
the extension name and description — because those are read by Chrome and by
the Web Store, not by us.

`auto` maps the browser tag onto the nearest catalogue rather than dropping to
English on a near miss: `zh-HK` and `zh-MO` resolve to `zh_TW`, `pt-PT` to
`pt_BR`, `en-GB` to `en`.

### Why two storage backends

`localStorage` is the only store readable *synchronously* at `document_start`,
and reading it there is what stops the page painting YouTube's default width
and then jumping. That is why it is still the source of truth for first paint.

`chrome.storage.local` exists because the popup is an extension page and
physically cannot write to youtube.com's `localStorage` — that origin belongs
to the page. So it is a channel, not a source: the popup writes it, and
`dock.js` mirrors it down into `localStorage` on the next load.

The honest consequence: a change made in the popup lands asynchronously on the
*next* YouTube load, so it can apply a frame late that once. Every load after
that is synchronous again. Widths dragged on the page write both stores at once
and never lag.

## How it works

Seven non-obvious things make this work, each of which took measuring the live DOM to find.

**Theater mode drops chat below the video, and that is YouTube's doing.**
Measured on a live stream at 1920x769 with the extension both on and off: the
two were identical, so this was never something the extension broke. What
YouTube does in theater is narrow the player by exactly 450px to reserve a side
slot — `#panels-full-bleed-container`, 1455..1905 — then leave that slot
**empty** and render chat underneath in `#columns`. It also reparents
`#chat-container`: in page mode it sits in `#secondary-inner`, in theater it is
a direct child of `#columns`, which is why one selector cannot find the chat
panel in every mode. CSS cannot move a node into a sibling container, so the
slot is filled by positioning `#chat-container` over it from measured
geometry. Verified: slot and chat both land on `1345,56 560x600`, and the video
fills its player box `1345x600` uncropped.

**Fullscreen is not an overlay problem.** YouTube already docks chat in fullscreen — it hides `#columns` entirely and moves chat into `#panels-full-bleed-container`, a flex sibling of the player inside `#full-bleed-container`. So resizing is pure flex sizing. No `position: fixed`, no z-index fights. The whole fullscreen section is a handful of `flex` declarations.

**The `<video>` element does not reflow.** YouTube writes the video's size as inline `width/height/left/top` from JavaScript and never recomputes it when CSS resizes the player. Shrink the player and the video keeps its old, larger box — visibly cropped. Measured: player `1157×651` while the video stayed `1346×757`. The fix hands sizing back to the browser with `width/height: 100%` plus `object-fit: contain`, in every mode.

**Chat has a hard floor of 298px.** YouTube sets `min-width: 298px` on `<yt-live-chat-app>`. Narrower than that and the app refuses to shrink while its iframe does, so the right edge of every message is clipped by an ancestor's `overflow: hidden`. Releasing that min-width — along with the `min-width: auto` on its flex descendants, which won't shrink below their content — lets chat reflow cleanly down to 120px with zero overflow.

**RTL is not detectable from `<html dir>`.** In right-to-left locales YouTube
mirrors the layout and docks chat on the left, so the divider must switch edges
and invert its drag direction. The obvious check fails: with `hl=ar`, YouTube
leaves `documentElement` at `direction: ltr` and applies `rtl` to `<body>`
instead. Measured with Arabic loaded — chat at `left: 18, right: 409`, player
starting at `409`. The side is therefore decided geometrically, by comparing the
panel's centre to the viewport's, which is immune to which element YouTube tags.

**Switching sides is one flex property, and it isn't "left".** Both containers
that can hold chat are flex rows, so `order: -1` on the chat side is the entire
mechanism — it moves the panel to the row's *start*, which is the left in LTR and
the right in RTL. The toggle therefore stores a flip, not a literal side, and the
geometric detection above keeps working without being told anything. Moving chat
left as-is left it flush against the window and doubled the gap to the video;
swapping `#secondary`'s horizontal padding restored YouTube's own 16px gutters
exactly — measured at 1920px wide, chat `16…456` and video `472…1889`, a pixel
mirror of the unflipped layout.

**The chat iframe swallows the pointer.** It's a real `<iframe>`, so once the cursor crosses into it mid-drag the parent stops receiving `pointermove`. Handled with `setPointerCapture` plus a transparent full-viewport shield inserted on `pointerdown`.

CSS is injected by the manifest at `document_start`, so it applies before first paint — no flash of YouTube's default sidebar width.

## Known limitations

- **Below 1000px viewport width** YouTube switches to a single-column layout where
  chat sits under the video. The extension deliberately does not apply there.
- **The side flip is unverified in true fullscreen and under RTL.** The fullscreen
  rule is the same `order: -1` on the same kind of flex row, and its failure mode
  is benign: chat simply stays put. Under RTL the flip works but the gutter
  correction may be cosmetically off.
- Widths live in `localStorage`, so clearing site data for youtube.com resets
  them. That is the price of applying them before first paint — see the comment
  in `dock.js`.
- Switching the extension off leaves the chat-iframe rules in `dock.css`
  section 4 applied, because `dock.js` runs in the top frame only and cannot
  set the off-switch attribute inside the iframe. Those rules only *release*
  YouTube's own min-widths, so with chat back at its default width they change
  nothing visible.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3, one permission (`storage`), one content script, one popup |
| `settings.js` | Keys, defaults and bounds. Loaded into both the page and the popup |
| `dock.css` | Layout, fullscreen sizing, video normalization, chat-iframe fixes, divider styling |
| `dock.js` | Drag logic and the storage mirror. Top frame only — the chat iframe gets CSS and nothing else |
| `popup.html/.css/.js` | Settings UI. Logical CSS properties throughout, so it mirrors in RTL |
| `i18n.js` | Every UI string, 12 languages. Loaded into both the page and the popup |
| `_locales/` | Two strings only — the name and description Chrome and the store read |
| `store/` | Chrome Web Store listing copy, privacy policy, generated assets, packaging |

## Support

If it saves you some squinting: https://ko-fi.com/hangyodev — and a star on
this repo helps more people find it.

## License

MIT
