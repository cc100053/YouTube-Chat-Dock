# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Manifest V3 Chrome extension that turns YouTube's live chat / chat replay into a fixed, resizable right-side panel with a draggable divider, working in page, theater and true fullscreen. Three source files, no build step, no dependencies, no test framework, no package.json.

## Commands

There is nothing to build or install. Validation is:

```bash
node --check dock.js                        # JS syntax
python3 -c "import json; json.load(open('manifest.json'))"   # manifest is valid JSON
```

To run it: `chrome://extensions/` → Developer mode → **Load unpacked** → repo root. After editing, hit reload on the extension card, then reload the YouTube tab.

## Verify by measuring, not by reasoning

This codebase has no unit tests because almost every bug is a wrong assumption about YouTube's live DOM. The only meaningful verification is measuring the real page. Every non-obvious line here exists because a plausible-looking assumption was measured and found false.

Load a **live stream or a VOD with chat replay** (an ordinary video has no chat and proves nothing), then read `getBoundingClientRect()` and `getComputedStyle()` off the real elements before and after a change. When something looks fixed, confirm the numbers, not the screenshot.

Past examples of assumptions that measured false:

- RTL was going to be detected with `getComputedStyle(documentElement).direction`. With `hl=ar`, YouTube leaves `<html>` at `ltr` and sets `rtl` on `<body>`. That check would have compiled, reviewed fine, and never fired.
- Fullscreen looked like it needed a `position: fixed` overlay. It does not — see below.
- The chat-iframe CSS used bare `#items`. That matched 9 unrelated elements on the watch page.

## Architecture

**Two layout modes, two different containers.** In page/theater mode chat lives in `#secondary` as `ytd-live-chat-frame#chat`. In true fullscreen YouTube hides `#columns` entirely and moves chat into `#panels-full-bleed-container`, a flex sibling of `#player-full-bleed-container` inside `#full-bleed-container`. So fullscreen is *pure flex sizing* — no fixed positioning, no z-index. `panel()` in `dock.js` is the single place that resolves which element represents "the chat panel" right now; everything else measures whatever it returns.

**CSS variables are the only interface between the two files.** `dock.css` declares `--ytchat-w` (page), `--ytchat-fsw` (fullscreen) and `--ytchat-top` with static defaults; `dock.js` overrides them as *inline* properties on `documentElement`, which outranks any stylesheet. Layout logic belongs in CSS, and JS should only ever move those three numbers.

**The manifest injects `dock.css` into all frames** (`all_frames: true`), including the chat iframe at `/live_chat`. Therefore **every chat-iframe rule must be scoped under `yt-live-chat-app`** or it leaks onto the watch page. The chat internals are light DOM, so descendant selectors work across them. `dock.js` guards the opposite way with `if (window.top !== window.self) return;` — the iframe gets styling and no script.

**Persistence is `localStorage`, deliberately, not `chrome.storage.local`.** `chrome.storage` is async, so at `document_start` the page would paint the default width and visibly jump on every load, and it would require the `storage` permission and end the zero-permission listing. Do not "modernise" this without re-reading the comment in `dock.js`.

**No single event is reliable** for knowing when YouTube has relaid out, so `dock.js` polls every `TICK_MS` (400ms, one `querySelector` + one rect) alongside `resize` / `scroll` / `fullscreenchange` / `yt-navigate-finish`. Everything on that path is wrapped in `safe()`, which caps logging at 3 so a throw can't spam the console 2.5×/second.

## Invariants that will silently break things

- **Never remove the `<video>` override** (`width/height: 100%` + `object-fit: contain` on `video.html5-main-video`). YouTube writes the video's size as inline `width/height/left/top` from JS and never recomputes it when CSS resizes the player. Without the override the video keeps its old, larger box and is visibly cropped after every drag — measured: player `1157×651`, video still `1346×757`.
- **`yt-live-chat-app` carries `min-width: 298px`.** Narrower than that, the app refuses to shrink while its iframe does, clipping the right edge of every message. Releasing it plus the `min-width: auto` on its flex descendants is what allows widths below 298px at all.
- **The chat is a real `<iframe>` and steals `pointermove` mid-drag.** Both `setPointerCapture` *and* the `#ytchat-resizer-shield` overlay are load-bearing; dropping either makes drags die when the cursor crosses into chat.
- **Widths are clamped against the live viewport**, not just `MAX`, reserving `KEEP_FOR_VIDEO`. A width saved on a large monitor otherwise restores verbatim onto a laptop and leaves the player a sliver.
- **Page-mode sizing is gated behind `@media (min-width: 1000px)`.** Below that YouTube stacks chat under the video; forcing a sidebar width there fights the stock responsive layout. The divider hides at the same breakpoint.
- **The side toggle stores a flip, never a literal "left"/"right".** It works by
  putting `order: -1` on the chat container, and `order` moves an item to the flex
  row's *start* — left in LTR, right in RTL. Storing "left" would invert the
  control in Arabic. The `data-ytchat-flip` attribute on `<html>` is the only
  interface; `panelOnLeft` still measures, and needs no knowledge of it.
- **Panel side is resolved geometrically** (`panelOnLeft`: panel centre vs viewport centre) and resolved *once* at `pointerdown` so a relayout cannot flip it mid-drag. The clamp guarantees the panel never reaches half the viewport, so the comparison is never ambiguous.

## Before publishing to the Chrome Web Store

- Bump `version` in `manifest.json`.
- `description` must be **≤ 132 characters** — the store rejects longer, and it has already been over once.
- Keep `permissions` and `host_permissions` absent. `content_scripts.matches` is sufficient and zero-permission is a deliberate property of the listing.
- Do not use YouTube's logo, wordmark, or red-and-white scheme in the icon or screenshots. Trademark risk on the store lives in visual branding far more than in a descriptive product name.

## Conventions

Comments explain *why*, and specifically what was measured — the numbers in them are real observations, not illustrations. Keep that: they are the only record of which YouTube behaviours were verified and when. Commit messages follow the same pattern, stating the measurement that justified the change.

**Commit and push every change without being asked.** Once the work is complete and validated (`node --check`, manifest JSON check, and whatever was measured on the live page), `git add -A`, commit, and `git push origin main`. Commit straight to `main` — that is this repo's entire history, and branching per change fights the intent. The exception is work that is knowingly broken or mid-refactor: say so instead of committing it.
