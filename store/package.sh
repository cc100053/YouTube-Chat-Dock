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
node --check i18n.js
python3 -c "import json; json.load(open('manifest.json'))"
# A malformed messages.json fails the upload with a generic error, so parse
# every locale here rather than finding out from the dashboard.
#
# The two ceilings are hard: the dashboard rejects the upload rather than
# truncating, and it applies them per locale, so a string that fits in English
# proves nothing. Spanish measured 133 on the first pass and French is now the
# tightest at 124/132 and 58/75. Measured here so the numbers in
# store/listing.md stay observations rather than recollections.
python3 -c "
import glob, json, sys
NAME_MAX, DESC_MAX = 75, 132
bad = 0
for f in sorted(glob.glob('_locales/*/messages.json')):
    m = json.load(open(f, encoding='utf-8'))
    loc = f.split('/')[1]
    n, d = len(m['extName']['message']), len(m['extDesc']['message'])
    over = ''
    if n > NAME_MAX or d > DESC_MAX:
        over, bad = '  <-- OVER', bad + 1
    print('  %-6s name %2d/%d  desc %3d/%d%s' % (loc, n, NAME_MAX, d, DESC_MAX, over))
    if 'extNameShort' not in m:
        print('  %-6s missing extNameShort (manifest action.default_title reads it)' % loc)
        bad += 1
print('locales ok:', len(glob.glob('_locales/*/messages.json')))
sys.exit(1 if bad else 0)"

# The landing page's FAQPage JSON-LD has to be word-for-word the visible
# answers — Google drops structured data that does not match the page, so
# editing one without the other is worse than shipping neither. Silent
# failure, therefore checked here.
python3 -c "
import re, json, html, sys
s = open('docs/index.html', encoding='utf-8').read()
g = json.loads(re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', s, re.S)[0])
faq = [n for n in g['@graph'] if n['@type'] == 'FAQPage'][0]
strip = lambda m: html.unescape(re.sub(r'\s+', ' ', re.sub(r'<.*?>', '', m))).strip()
h2 = [strip(m) for m in re.findall(r'<h2>(.*?)</h2>', s, re.S)]
ans = [strip(m) for m in re.findall(r'<p class=\"answer\">(.*?)</p>', s, re.S)]
bad = 0
for i, q in enumerate(faq['mainEntity']):
    if q['name'] != h2[i] or q['acceptedAnswer']['text'] != ans[i]:
        print('  FAQ JSON-LD does not match the page at question %d: %r' % (i, q['name']))
        bad += 1
print('landing page: %d questions, %d visible answers, %d mismatches' % (len(faq['mainEntity']), len(ans), bad))
sys.exit(1 if bad else 0)"

# A donate link that 404s is worse than no donate link, and popup.js hides the
# button unless COFFEE_URL is an absolute https URL. Fail the build rather than
# ship a coffee button that silently does not exist. Checked here too, not just
# at runtime, because a hidden button is easy to miss in a manual smoke test.
coffee=$(sed -n "s/^  var COFFEE_URL = '\(.*\)';$/\1/p" popup.js)
case "$coffee" in
  https://*.*/*)
    echo "coffee link: $coffee" ;;
  '')
    echo "COFFEE_URL is unset in popup.js — set it or delete this check." >&2
    exit 1 ;;
  *)
    echo "COFFEE_URL must be an absolute https URL, got: $coffee" >&2
    exit 1 ;;
esac

rm -f "$out"
zip -r -q "$out" manifest.json dock.css dock.js settings.js i18n.js \
    popup.html popup.css popup.js _locales icons LICENSE

echo "$out"
unzip -l "$out"
