# Privacy Policy — YouTube Chat Dock

Last updated: 3 August 2026 (v1.4.0)

## Short version

YouTube Chat Dock collects nothing and sends nothing. It stores your own
settings, on your own device, and nothing else.

## What is collected

Nothing. The extension does not collect, record, or transmit any personal
information, browsing history, video identifiers, chat content, account
details, or usage analytics.

## What is stored, and where

Five values, and only these five:

- the chat panel width you last set in page view,
- the width you last set in fullscreen,
- whether you flipped the panel to the other side,
- whether the extension is switched on,
- whether the drag divider is shown.

They are held in two places on your own device, for two different reasons.
`localStorage` for `youtube.com` is read synchronously before the page paints,
which is what stops the layout flickering on load. `chrome.storage.local` holds
the same five values so the settings popup — which is a separate extension page
and cannot reach youtube.com's storage — can change them.

Neither store leaves your computer. `chrome.storage.local` is local storage,
not synced storage: nothing is written to your Google account. Clearing site
data for youtube.com resets the first copy; removing the extension removes the
second.

## Network activity

The extension makes no network requests of any kind. It contains no analytics
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

## Data sharing and sale

No data is collected, so none is shared, sold, transferred, or used for
advertising, credit assessment, or any other purpose.

## Children's privacy

The extension collects no data from anyone, including children.

## Changes

If a future version ever collects or transmits data, this policy will be
updated before that version is published, and the change will be visible in
the extension's public commit history.

## Source

The complete source is public and MIT licensed. Every claim above can be
verified by reading it — it is a handful of small files and has no build step.

https://github.com/cc100053/YouTube-Chat-Dock

## Contact

Open an issue at
https://github.com/cc100053/YouTube-Chat-Dock/issues
