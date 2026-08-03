# Privacy Policy — YouTube Chat Dock

Last updated: 3 August 2026

## Short version

YouTube Chat Dock collects nothing, sends nothing, and stores one thing —
your chosen panel widths — in your own browser.

## What is collected

Nothing. The extension does not collect, record, or transmit any personal
information, browsing history, video identifiers, chat content, account
details, or usage analytics.

## What is stored, and where

Three values are saved in your browser's `localStorage` for `youtube.com`:

- the chat panel width you last dragged to in page view,
- the width you last dragged to in fullscreen,
- whether you flipped the panel to the other side.

These stay on your computer. They are readable only by the extension and by
youtube.com in your own browser, and are never uploaded anywhere. Clearing
site data for youtube.com deletes them and resets the defaults.

## Network activity

The extension makes no network requests of any kind. It contains no analytics
SDK, no telemetry, no remote configuration, no error reporting, and no
third-party libraries. It has no background service worker, so no code runs
when you are not on a YouTube page.

## Permissions

The extension declares no permissions and no host permissions. It consists of
one stylesheet and one script injected on `https://www.youtube.com/*` via the
manifest's `content_scripts.matches`, which requires no permission grant. This
is why Chrome shows no permission prompt when you install it.

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
verified by reading it — it is three files and has no build step.

https://github.com/cc100053/YouTube-Chat-Dock

## Contact

Open an issue at
https://github.com/cc100053/YouTube-Chat-Dock/issues
