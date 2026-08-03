# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Manifest V3 Chrome extension that turns YouTube's live chat / chat replay into a fixed, resizable right-side panel with a draggable divider, working in page, theater and true fullscreen. Plus a toolbar settings popup and 12 locales. No build step, no dependencies, no test framework, no package.json.

## Commands

There is nothing to build or install. Validation is:

```bash
node --check dock.js && node --check settings.js && node --check popup.js && node --check i18n.js
python3 -c "import json; json.load(open('manifest.json'))"   # manifest is valid JSON
./store/package.sh    # runs all of the above, parses every locale, builds the ZIP
```

The popup can be rendered outside Chrome for layout work by stubbing
`chrome.i18n` and `chrome.storage.local` and serving `popup.html` over
localhost — `file://` is blocked. Do that in **an LTR locale and `ar`** — the popup uses logical CSS properties
precisely so it mirrors, and only rendering it in RTL proves it does — and
loop the language picker over **all twelve** when changing layout, measuring
`document.body.getBoundingClientRect().height` each time.

To run it: `chrome://extensions/` → Developer mode → **Load unpacked** → repo root. After editing, hit reload on the extension card, then reload the YouTube tab.

## Verify by measuring, not by reasoning

This codebase has no unit tests because almost every bug is a wrong assumption about YouTube's live DOM. The only meaningful verification is measuring the real page. Every non-obvious line here exists because a plausible-looking assumption was measured and found false.

Load a **live stream or a VOD with chat replay** (an ordinary video has no chat and proves nothing), then read `getBoundingClientRect()` and `getComputedStyle()` off the real elements before and after a change. When something looks fixed, confirm the numbers, not the screenshot.

Past examples of assumptions that measured false:

- RTL was going to be detected with `getComputedStyle(documentElement).direction`. With `hl=ar`, YouTube leaves `<html>` at `ltr` and sets `rtl` on `<body>`. That check would have compiled, reviewed fine, and never fired.
- Fullscreen looked like it needed a `position: fixed` overlay. It does not — see below.
- The chat-iframe CSS used bare `#items`. That matched 9 unrelated elements on the watch page.

## Architecture

**Three layout modes, three different containers, because YouTube reparents chat.** Page mode: `#chat-container` inside `#secondary-inner`. Theater: the same `#chat-container` as a direct child of `#columns`, with chat rendered *below* the video — measured identical with the extension on and off, so it is YouTube's behaviour, not ours. Fullscreen: `#panels-full-bleed-container`. `panel()` in `dock.js` is the single place that resolves which element is "the chat panel" right now.

In true fullscreen YouTube hides `#columns` entirely, so fullscreen is *pure flex sizing* — no fixed positioning, no z-index. Theater is the one mode that needs fixed positioning, and only because CSS cannot reparent a node into the slot YouTube reserved for it.

**CSS variables are the only interface between `dock.css` and `dock.js`.** `dock.css` declares `--ytchat-w` (page), `--ytchat-tw` (theater), `--ytchat-fsw` (fullscreen), `--ytchat-top`, and the three measured theater geometry values `--ytchat-tt/-tl/-th`, all with static defaults; `dock.js` overrides them as *inline* properties on `documentElement`, which outranks any stylesheet. Layout logic belongs in CSS, and JS should only ever move those numbers.

**The manifest injects `dock.css` into all frames** (`all_frames: true`), including the chat iframe at `/live_chat`. Therefore **every chat-iframe rule must be scoped under `yt-live-chat-app`** or it leaks onto the watch page. The chat internals are light DOM, so descendant selectors work across them. `dock.js` guards the opposite way with `if (window.top !== window.self) return;` — the iframe gets styling and no script.

**Popup sliders write on every animation frame, not on release**, so the page tracks them the way it tracks the divider. `bindRange` coalesces with `requestAnimationFrame` — measured 60 input events down to 14 writes — and `reapply()` in `dock.js` clears its trailing re-measure timer, or one drag would leave dozens of overlapping timers firing after it ended. The toast stays on `change`; per frame it would sit permanently lit and read as a stuck UI.

**Persistence is two stores with asymmetric roles, and the asymmetry is the point.** `localStorage` is the only store readable *synchronously* at `document_start`, so it stays the source of truth for first paint — reading it there is what stops the page painting the default width and visibly jumping. `chrome.storage.local` was added in v1.4.0 only because the popup is an extension page and physically cannot write youtube.com's `localStorage`; it is a channel, not a source. `dock.js` mirrors it *down* into `localStorage`, seeding it *up* only for keys the extension store has never seen (which is what carries pre-1.4.0 widths through the upgrade). Do not collapse these into one store without re-reading the comment block in `dock.js`.

**`settings.js` is loaded into both worlds** — as the first content script, and as a plain script in `popup.html` — so key names, defaults and bounds have one definition. Content scripts share an isolated-world scope, which is why `dock.js` can read `YTCHAT` off a global.

**UI strings are a table in `i18n.js`, deliberately not `chrome.i18n`.** `chrome.i18n` always resolves to the browser's UI language and offers no runtime override, so a user-selectable language is impossible with it. `_locales/` survives holding exactly two strings — `extName` and `extDesc` — because Chrome and the Web Store read those, and only those. Both `dock.js` and `popup.js` fill every string from the table, with no hard-coded English anywhere: a missing key falls back to `en` uniformly inside `ytchatMsg`, rather than leaving one control in the wrong language. `ytchatResolveLang` maps browser tags onto the twelve catalogues (`zh-HK` → `zh_TW`, `pt-PT` → `pt_BR`) instead of dropping to English on a near miss.

**No single event is reliable** for knowing when YouTube has relaid out, so `dock.js` polls every `TICK_MS` (400ms, one `querySelector` + one rect) alongside `resize` / `scroll` / `fullscreenchange` / `yt-navigate-finish`. Everything on that path is wrapped in `safe()`, which caps logging at 3 so a throw can't spam the console 2.5×/second.

## Invariants that will silently break things

- **Never remove the `<video>` override** (`width/height: 100%` + `object-fit: contain` on `video.html5-main-video`). YouTube writes the video's size as inline `width/height/left/top` from JS and never recomputes it when CSS resizes the player. Without the override the video keeps its old, larger box and is visibly cropped after every drag — measured: player `1157×651`, video still `1346×757`.
- **`yt-live-chat-app` carries `min-width: 298px`.** Narrower than that, the app refuses to shrink while its iframe does, clipping the right edge of every message. Releasing it plus the `min-width: auto` on its flex descendants is what allows widths below 298px at all.
- **The chat is a real `<iframe>` and steals `pointermove` mid-drag.** Both `setPointerCapture` *and* the `#ytchat-resizer-shield` overlay are load-bearing; dropping either makes drags die when the cursor crosses into chat.
- **Widths are clamped against the live viewport**, not just `MAX`, reserving `KEEP_FOR_VIDEO`. A width saved on a large monitor otherwise restores verbatim onto a laptop and leaves the player a sliver.
- **Every watch-page rule is gated behind `:root:not([data-ytchat-off])`.** The manifest injects `dock.css` statically and nothing can unload it, so the popup's off switch has to be expressed in CSS. `dock.js` sets the attribute at `document_start`, which is what makes "off" mean *no flash of a docked layout* rather than a flicker. Section 4 (chat iframe) is deliberately ungated: `dock.js` is top-frame only, so the attribute can never land there — and those rules only release YouTube's min-widths, so they are inert when the extension is off.
- **Theater docking is fixed positioning over a slot YouTube already emptied**, and section 2c stays inert until `dock.js` has measured it — `data-ytchat-theater` is set only after a valid rect, so the chat never jumps to a placeholder position. `--ytchat-tw` resizes the reservation itself, which is what keeps the player's width and the chat's width in agreement. Re-measure on every `pointermove` during a theater drag: the panel is fixed, so it does not follow the width on its own.
- **Popup height is capped at 600px by Chrome, and translated UI cannot be height-tuned.** The first attempt tuned the content to fit and measured 589 — in en, zh_TW and ar. Measuring all twelve afterwards found **six** over the cap, Russian at 733. The panel is now a flex column: `header` and `footer` are `flex: none`, `main` is the only scroller (`overflow-y: auto` plus `min-height: 0`, or the flex item refuses to shrink). Short languages still size naturally; long ones scroll the list and keep Reset reachable. Verify a layout change against **all twelve**, not a sample — the sample is what hid this.
- **Grid column widths must match `popup.html`'s source order.** `.range` is `title, output, range`; it was styled `1fr 88px 46px` as if the slider came second, so the 88px slider landed in the 46px column and its right end was clipped off the popup edge. Measure `getBoundingClientRect().right` against the content edge, not by eye.
- **Page-mode sizing is gated behind `@media (min-width: 1000px)`.** Below that YouTube stacks chat under the video; forcing a sidebar width there fights the stock responsive layout. The divider hides at the same breakpoint.
- **The side toggle stores a flip, never a literal "left"/"right".** It works by
  putting `order: -1` on the chat container, and `order` moves an item to the flex
  row's *start* — left in LTR, right in RTL. Storing "left" would invert the
  control in Arabic. The `data-ytchat-flip` attribute on `<html>` is the only
  interface; `panelOnLeft` still measures, and needs no knowledge of it.
- **Panel side is resolved geometrically** (`panelOnLeft`: panel centre vs viewport centre) and resolved *once* at `pointerdown` so a relayout cannot flip it mid-drag. The clamp guarantees the panel never reaches half the viewport, so the comparison is never ambiguous.

## Before publishing to the Chrome Web Store

Listing copy, privacy policy and every image asset live in `store/`.
`store/listing.md` is the source of truth for the dashboard fields and carries
the measured character counts; `store/make_assets.py` regenerates all images
(and the packed `icons/`) from code, so nothing is hand-edited in an image
editor; `store/package.sh` builds the upload ZIP and validates first.

- Bump `version` in `manifest.json`.
- Keep `permissions` at exactly `["storage"]` and `host_permissions` absent. `content_scripts.matches` is sufficient for the host side. `storage` generates no install warning, so the listing can still say Chrome asks the user to approve nothing — but it must say "one permission", never "zero".
- `description` is `__MSG_extDesc__`; the real strings are in `_locales/*/messages.json` and the 132-character limit applies to **every** locale. Spanish measured 133 on the first pass.
- Do not use YouTube's logo, wordmark, or red-and-white scheme in the icon or screenshots. Trademark risk on the store lives in visual branding far more than in a descriptive product name.

## Conventions

Comments explain *why*, and specifically what was measured — the numbers in them are real observations, not illustrations. Keep that: they are the only record of which YouTube behaviours were verified and when. Commit messages follow the same pattern, stating the measurement that justified the change.

**Commit and push every change without being asked.** Once the work is complete and validated (`node --check`, manifest JSON check, and whatever was measured on the live page), `git add -A`, commit, and `git push origin main`. Commit straight to `main` — that is this repo's entire history, and branching per change fights the intent. The exception is work that is knowingly broken or mid-refactor: say so instead of committing it.
