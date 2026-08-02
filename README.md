# YouTube Chat Dock

A Chrome extension that turns YouTube's live chat and chat replay into a **fixed, resizable right-side panel** — with a draggable divider that works in page view, theater mode, and true fullscreen.

Not a floating overlay. The video is resized to fit beside the chat, never covered by it.

- **Drag the divider** to resize. Page mode and fullscreen remember separate widths.
- **Double-click** the divider to reset.
- **Chat replay** on VODs works exactly like live chat.
- **No permissions.** No API calls, no network requests, no tracking.

## Install

Until it's on the Chrome Web Store:

1. Clone or download this repo
2. Go to `chrome://extensions/` and enable **Developer mode**
3. **Load unpacked** → select the repo folder
4. Reload YouTube

## Configuration

Widths are set by dragging, and persist in `localStorage`. The bounds live at the top of `dock.js`:

```js
const MIN = 120;             // narrowest draggable width
const MAX = 1100;            // widest
const KEEP_FOR_VIDEO = 480;  // player never squeezed below this
const TOP_GAP = 72;          // gap under the masthead in page mode
```

Widths are clamped against the *current* viewport on every load, so a width
saved on a large monitor won't leave a sliver of video on a laptop.

Defaults (440px page / 560px fullscreen) are in `dock.css` under `:root`.

## How it works

Four non-obvious things make this work, each of which took measuring the live DOM to find.

**Fullscreen is not an overlay problem.** YouTube already docks chat in fullscreen — it hides `#columns` entirely and moves chat into `#panels-full-bleed-container`, a flex sibling of the player inside `#full-bleed-container`. So resizing is pure flex sizing. No `position: fixed`, no z-index fights. The whole fullscreen section is a handful of `flex` declarations.

**The `<video>` element does not reflow.** YouTube writes the video's size as inline `width/height/left/top` from JavaScript and never recomputes it when CSS resizes the player. Shrink the player and the video keeps its old, larger box — visibly cropped. Measured: player `1157×651` while the video stayed `1346×757`. The fix hands sizing back to the browser with `width/height: 100%` plus `object-fit: contain`, in every mode.

**Chat has a hard floor of 298px.** YouTube sets `min-width: 298px` on `<yt-live-chat-app>`. Narrower than that and the app refuses to shrink while its iframe does, so the right edge of every message is clipped by an ancestor's `overflow: hidden`. Releasing that min-width — along with the `min-width: auto` on its flex descendants, which won't shrink below their content — lets chat reflow cleanly down to 120px with zero overflow.

**The chat iframe swallows the pointer.** It's a real `<iframe>`, so once the cursor crosses into it mid-drag the parent stops receiving `pointermove`. Handled with `setPointerCapture` plus a transparent full-viewport shield inserted on `pointerdown`.

CSS is injected by the manifest at `document_start`, so it applies before first paint — no flash of YouTube's default sidebar width.

## Known limitations

- **RTL locales.** YouTube mirrors its layout in right-to-left languages, putting
  the sidebar on the left. Widths still apply correctly, but the divider stays on
  the panel's left edge, so the drag direction feels inverted.
- **Below 1000px viewport width** YouTube switches to a single-column layout where
  chat sits under the video. The extension deliberately does not apply there.
- Widths live in `localStorage`, so clearing site data for youtube.com resets them.
  This is a deliberate trade for zero permissions and no load flicker — see the
  comment in `dock.js`.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3, no permissions, one content script |
| `dock.css` | Layout, fullscreen sizing, video normalization, chat-iframe fixes, divider styling |
| `dock.js` | Drag logic. Top frame only — the chat iframe gets CSS and nothing else |

## License

MIT
