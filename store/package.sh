#!/usr/bin/env bash
# Build the upload ZIP for the Chrome Web Store.
#
# The store rejects a ZIP whose manifest sits in a subdirectory, so the files
# are zipped from the repo root, not from a wrapper folder. store/, .git/ and
# the docs are excluded — everything the store needs is the four runtime
# entries and nothing else.
set -euo pipefail

cd "$(dirname "$0")/.."

version=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
out="store/yt-chat-dock-${version}.zip"

node --check dock.js
node --check settings.js
node --check popup.js
python3 -c "import json; json.load(open('manifest.json'))"
# A malformed messages.json fails the upload with a generic error, so parse
# every locale here rather than finding out from the dashboard.
python3 -c "
import glob, json
for f in sorted(glob.glob('_locales/*/messages.json')): json.load(open(f, encoding='utf-8'))
print('locales ok:', len(glob.glob('_locales/*/messages.json')))"

rm -f "$out"
zip -r -q "$out" manifest.json dock.css dock.js settings.js \
    popup.html popup.css popup.js _locales icons LICENSE

echo "$out"
unzip -l "$out"
