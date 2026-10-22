# Privacy Policy — YouTube Chat Dock

Last updated: 22 October 2026 (v2.0.2)

## Short version

YouTube Chat Dock has no automatic data collection, analytics or telemetry.
Settings stay on your device. If you choose to open the external feedback form,
its URL includes the extension version and selected interface language; any
feedback you submit is handled separately as described below.

## What is collected

During normal operation, the extension does not collect, record, or transmit any personal
information, browsing history, video identifiers, chat content, account
details, or usage analytics.

## What is stored, and where

The ten preferences defined in `settings.js`:

- chat width in page view (`ytchat-w`),
- chat width in fullscreen (`ytchat-fsw`),
- chat width in theater mode (`ytchat-tw`),
- whether the panel side is flipped (`ytchat-flip`),
- whether docking is enabled (`ytchat-enabled`),
- whether the drag divider is shown (`ytchat-divider`),
- whether theater docking is enabled (`ytchat-theater`),
- interface language preference (`ytchat-lang`),
- whether blank chat-replay recovery is enabled (`ytchat-chatfix`),
- whether pause-on-hover is enabled (`ytchat-hoverpause`).

They are held in two places on your device. YouTube's `localStorage` is read
synchronously before the page paints to apply the saved layout immediately.
`chrome.storage.local` lets the separate settings popup communicate preferences
to the content scripts. Page changes write to both stores; the extension store
is mirrored back into YouTube's local storage.

Neither store is synced to a cloud account. `chrome.storage.local` is local storage,
not synced storage: nothing is written to your Google account. Clearing site
data for youtube.com removes the first copy, which the extension store can
restore on the next load. Use Reset to defaults in the popup for a deliberate
reset. Removing the extension removes its extension store; it does not itself
clear the YouTube-origin copy.

## Network activity

The extension makes no automatic network requests during normal operation. It contains no analytics
SDK, no telemetry, no remote configuration, no error reporting, and no
third-party libraries. It has no background service worker, so no code runs
when you are not on a YouTube page.

## Permissions

The extension declares exactly one permission, `storage`, and no host
permissions at all. `storage` is what lets the settings popup save your choices
where the content script can read them; it grants no access to your browsing,
your history, or any site. Chrome shows no permission prompt on install,
because `storage` is not a permission Chrome warns about.

The extension acts on `https://www.youtube.com/*` and nowhere else, via the
manifest's `content_scripts.matches`, which requires no permission grant.

## Optional external links and feedback

The popup contains links to an external feedback form (Tally), donations
(Ko-fi), the Chrome Web Store review page and GitHub. The extension does not
open these automatically. Clicking one opens the external website, whose own
privacy policy and normal network handling apply.

The feedback URL includes `v` (the installed extension version) and `lang`
(the selected interface language). Opening it therefore sends those two
values to the form provider. It does not attach video identifiers, chat
messages or browsing history. If you submit the form, the feedback text and
any optional email address you enter are sent to the form provider and made
available to the developer. Submitting feedback is optional.

## Data sharing and sale

The extension does not sell user data or automatically transfer browsing,
chat or account information to third parties. Optional feedback is handled
as described above.

## Children's privacy

The extension has no automatic data collection from anyone, including children.
Optional external forms remain subject to the provider’s policies.

## Changes

If a future version changes data handling, this policy will be
updated before that version is published, and the change will be visible in
the extension's public commit history.

## Source

The complete source is public and MIT licensed. Every claim above can be
verified by reading it — it is a handful of small files and has no build step.

https://github.com/cc100053/YouTube-Chat-Dock

## Contact

Open an issue at
https://github.com/cc100053/YouTube-Chat-Dock/issues
