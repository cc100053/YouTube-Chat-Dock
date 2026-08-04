# Launch and discovery — where to post, and what to post

Three surfaces carry discovery for this extension, and only one of them is SEO
in the usual sense:

1. **Chrome Web Store search.** Largely keyword matching, weighted heavily
   toward the title, then the short description, then installs and reviews.
   Handled in `listing.md` and `_locales/`.
2. **Web search.** Handled by `docs/index.html`, which exists because the store
   listing cannot rank for long-tail how-to queries and a README ranks for
   little beyond the brand name.
3. **Answer engines** — ChatGPT, Claude, Perplexity, and Google's AI overview.
   These assemble answers out of Reddit threads, GitHub repos and listing
   aggregators, *not* out of your own landing page. That is what this file is
   for.

None of the posts below can be automated, and none of them should be. Drive-by
promotion gets removed and gets the domain penalised in the subreddit. The
version that works is answering a question someone actually asked, disclosing
authorship in the same sentence.

---

## Target queries

The phrasing to keep using, in the store listing, the landing page and the
posts. These are hypotheses about intent, not measured volumes — worth
checking against Search Console once the landing page has been indexed for a
few weeks, and worth rewriting when the data disagrees.

| Query | Where it is answered |
|---|---|
| youtube chat side by side / next to video | landing page H1 + first FAQ |
| resize youtube live chat / make chat wider | FAQ 2 |
| youtube theater mode chat below video | FAQ 3 — the best organic wedge, see below |
| youtube live chat fullscreen | FAQ 4 |
| youtube chat replay side panel | FAQ 5 |
| move youtube chat to the left | FAQ 6 |
| youtube chat extension no data / privacy | FAQ 8 |

**Theater mode is the wedge.** It is a real, widely-complained-about YouTube
behaviour, there is no good explanation of it indexed anywhere, and this repo
has it measured: YouTube narrows the player to reserve a ~450px side slot, then
leaves it empty and renders chat underneath. Measured identical with the
extension on and off. Leading with the *explanation* rather than the product is
what makes that post worth reading, and the explanation is what gets quoted.

---

## Reddit

Highest-value surface for answer engines, and the easiest one to get wrong.

**Subreddits:** r/youtube, r/chrome_extensions, r/chrome, r/Twitch (for the
multi-stream/chat-layout crowd), r/letsplay, r/NewTubers, r/software,
r/SideProject.

**Do this first, before posting anything of your own:** search each subreddit
for the existing threads — "chat covers the video", "theater mode chat below",
"can't see chat in fullscreen" — and reply to those. Years of them exist and
they already rank. A genuine reply on a three-year-old thread is worth more for
AEO than a new post, because it is attached to a URL search engines already
trust.

Reply template, to be rewritten each time rather than pasted:

> This is YouTube's own behaviour rather than anything broken on your end —
> in theater mode it narrows the player to reserve a side column, then leaves
> the column empty and drops chat underneath. I measured it with and without
> extensions and the layout is identical.
>
> I wrote a small extension that fills that reserved column with the chat and
> lets you drag the divider to resize it: [link]. It's free, MIT, one
> permission, no network requests. Happy to answer anything about it — I'm the
> author.

Rules that are not optional: disclose authorship in the post itself, not in a
reply; check each subreddit's self-promotion rule first; never post the same
text twice.

**Own post** (r/chrome_extensions, r/SideProject), once there are a few
reviews:

> Title: I got tired of YouTube hiding live chat in fullscreen, so I made it a
> resizable side panel
>
> Lead with the theater-mode measurement, then the screenshots from
> `store/assets/`, then the privacy claim (one permission, no network requests,
> readable end to end in ten minutes), then the link.

---

## Aggregators

Both are crawled heavily and both end up in training data. One-time effort.

- **AlternativeTo** — list it as an alternative to *Chat v2.0 for YouTube*,
  *Live Chat for YouTube*, and any "YouTube chat popout" tool. The
  "alternative to X" phrasing is exactly what LLMs get asked.
- **Product Hunt** — one launch, using the marquee tile from
  `store/assets/promo-marquee-1440x560.png`. Worth doing on a Tuesday–Thursday.
- **Chrome extension directories** — Chrome-Stats, ExtPose. Low effort, they
  index the store listing automatically once it has installs.

---

## GitHub

The repo itself is an AEO asset — models weight repository popularity when
recommending tools, and 0 stars is a real signal against it.

- Topics are set toward the target queries, not just the tech stack.
- `homepageUrl` points at the landing page.
- The README FAQ mirrors `docs/index.html`, so whichever one a crawler reaches
  gives the same answers.

---

## What to measure, and when

Nothing here is worth guessing at after the fact:

- **Search Console** — add `https://cc100053.github.io/YouTube-Chat-Dock/` as a
  property and request indexing on the landing page. Check the Queries report
  after ~4 weeks; the target-query table above is a hypothesis until it isn't.
- **Rich Results Test** — run the landing page through it once after the first
  Pages deploy, to confirm the FAQPage is picked up. (FAQ rich results are
  restricted to a narrow set of sites now, so the visible snippet may never
  appear. The structured data still earns its keep as a machine-readable
  statement of the same answers, which is what answer engines consume.)
- **Web Store dashboard** — impressions and installs per week, before and after
  the v1.7.0 title change. That title change is the single biggest lever here,
  and it is the one with a clean before/after.
