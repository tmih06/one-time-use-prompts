## Context

You are running a one-time, comprehensive technical SEO + GEO (AI-search readiness)
audit-and-fix on this existing, already-built web project. This condenses the SEO
Prompt Master workflow (START.md, phase prompts 00–05, checklists and scoring
rubric from github.com/umutxyp/Seo-Promt-Master) into a single self-contained run.

Two principles drive everything:

- **Read the source AND observe what the server returns.** They disagree more
  often than expected — soft 404s, one-way hreflang sets, canonicals pointing at
  redirects, metadata streamed past `</head>` — and the gap is where the bugs
  live.
- **The rules in this prompt are the source of truth**, distilled from Google
  Search Central and web.dev plus the official docs of Bing, Yandex, Apple and
  the AI-crawler operators. If a claim is not backed by them, say "not covered"
  rather than recalling SEO lore — much common advice predates INP replacing
  FID, FAQ rich results losing their rich-result treatment (May 2026), and
  `rel=next/prev` falling out of use.

**The Guardrails section is binding throughout the whole task. Read it before
starting.**

## Goal

Bring every public page into compliance with technical SEO guidance and AI-search
(GEO) readiness, fixing what is fixable in the codebase and proving each fix
against rendered output. Persist progress to files so the run survives resets,
and finish with verified SEO and GEO scores out of 100 with per-category
breakdowns — not a vibe.

## Inputs

- `{{SITE_URL}}` — the live site URL, or a local build URL such as
  `http://localhost:3000`. Used for the live baseline in Phase 0 and the optional
  Phase 5. If no URL is reachable, run the source-only path and mark live checks
  as skipped.
- Everything else is discovered from the repository itself.

## Instructions

Work through the phases in order without pausing between phases, pages, or
backlog items. The only legitimate stops: (a) you cannot access the repository,
run the build, or determine the stack; (b) a finding needs a real business
decision (e.g. whether a route should be public at all, or the AI
training-vs-citation policy) — ask that one specific question and continue on
everything else; (c) you are resuming — `ROUTES-INVENTORY.md` and
`SEO-AUDIT-PROGRESS.md` already exist, so read them, state in one line where you
are resuming, and continue without re-litigating decided items.

### Phase 0 — Bootstrap and detect

1. Detect the stack: framework and version; rendering model (SSR/SSG/ISR vs CSR —
   decisive for indexability); routing convention; i18n (locales, URL strategy —
   subdirectory `/de/`, subdomain, ccTLD, or none); where SEO lives (central
   metadata helper, sitemap, robots, JSON-LD); and the verification commands
   (typecheck, lint, build).
2. Site maturity: new or established domain? Candidate URL count vs actually
   indexed count (Search Console *Pages* report if the user can share it). A new
   domain with thousands of candidate URLs means the sitemap is ramped, not
   dumped — see the Phase 4 recipes.
3. Industry: identify the vertical (e-commerce, SaaS, marketplace, local
   business, publisher, job board, etc.) and add its specifics to the audit —
   e.g. Product+offers schema for e-commerce, LocalBusiness NAP matching the
   Business Profile for local, JobPosting for job boards.
4. Live baseline: if Node 18+ and a reachable `{{SITE_URL}}` exist, run
   `npx github:umutxyp/Seo-Promt-Master --url {{SITE_URL}} --max 40 --md seo-report.md`.
   Otherwise fetch `{{SITE_URL}}/robots.txt`, the sitemap it names, the homepage
   HTML, and two inner pages yourself. Keep the findings beside you for the whole
   run — the tool sees what source review structurally cannot.
5. Write a short Stack Report (framework, rendering, routing, i18n, existing SEO
   infrastructure, maturity, verification commands, matched verticals) at the top
   of `SEO-AUDIT-PROGRESS.md`.

### Phase 1 — Discover and classify every route

Enumerate every route — walk file-based route folders, route config, controllers,
or the existing sitemap; include dynamic patterns (`[slug]`, `:id`, `*`) and do
not forget home, listings, detail, tools, auth, legal and API. Classify each into
exactly one bucket:

| Bucket | Meaning | robots | In sitemap? |
|---|---|---|---|
| `public-index` | Real content users search for | `index,follow` | yes |
| `public-noindex` | Reachable but should not rank: internal search results, tools with unbounded inputs, auth screens, thank-you pages | `noindex,follow` | no |
| `private` | Dashboards, admin, account, API | `Disallow` in robots.txt + auth gate | no |

Then flag mismatches — the high-value part: pages public in intent but wrongly
`noindex`/`Disallow`-ed; indexable free-text search URLs; private routes in the
sitemap or missing a robots block; dynamic routes answering 200 for nonexistent
entities (soft 404); multiple URL keys resolving to one entity (id vs slug vs
uuid, case, params) needing one canonical + redirect.

Write `ROUTES-INVENTORY.md`: one row per route (route | current → correct bucket |
rendering | notes), grouped by section, ending with a "Mismatches to fix" list
that feeds Phase 3.

### Phase 2 — Audit every public page (9-point check)

For every `public-index` route, read the route file AND its main
component/template, then evaluate all nine:

1. **Metadata** — unique, descriptive title and meta description generated per
   page (built from the entity for dynamic pages); complete Open Graph + Twitter
   card.
2. **Canonical / hreflang / redirects / host** — self-referential canonical; if
   multilingual, a bidirectional self-referential hreflang set + `x-default` +
   valid ISO codes (verify reciprocity per locale-template — a one-way set is
   discarded in full); no internal link or canonical pointing through a redirect
   chain; no 302 standing in for a 301. Once per project: HTTPS everywhere and
   exactly one canonical host — the other `www`/non-`www`, `http://` and
   trailing-slash variants all 301 to it.
3. **Robots** — `index,follow` on real content; `noindex` only in the
   `public-noindex` bucket; never combine `Disallow` with `noindex` on the same
   URL (the Disallow prevents Google from seeing the noindex). Once per project:
   robots.txt deliberately addresses AI crawlers (see Phase 4) and leaves
   Bingbot, Applebot and other wanted engines unblocked and unthrottled.
4. **Structured data** — baseline `WebPage` + `BreadcrumbList` JSON-LD on every
   public page, plus a type-appropriate schema (Article/BlogPosting, Product,
   ItemList/CollectionPage for lists, ProfilePage+Person,
   DiscussionForumPosting, SoftwareApplication, LocalBusiness, JobPosting;
   FAQPage is still valid but earns no Google rich result since May 2026).
   Reflects only visible content. Product needs `name`/`image`/`offers`
   (price + priceCurrency; availability recommended); `aggregateRating`/`review`
   only for genuine reviews rendered on the page — never aggregated from other
   sites, never undisclosed incentivized.
5. **Headings and semantics** — exactly one `<h1>`; semantic landmarks
   (`main`/`nav`/`article`/`section`). Heading order is an accessibility note,
   not a ranking factor — record but do not over-prioritize.
6. **Images** — descriptive `alt`; explicit `width`/`height` (CLS); the LCP
   candidate — the largest `<img>` or visible element in the initial viewport,
   usually the first hero image, not a logo — is eager with
   `fetchpriority=high`, not lazy and not `data-src`; below-fold images lazy;
   real `<img src>` (indexable), not CSS background.
7. **Internal links** — real crawlable `<a href>` (not button/onclick/JS-only);
   descriptive anchors; every important page linked from somewhere; pagination
   uses real `?page=n` links with a self-canonical per page (not load-more-only,
   not canonicalize-all-to-page-1); UGC links carry `rel="ugc"`, ads
   `rel="sponsored"`.
8. **Rendering** — primary content in the initial server-rendered HTML
   (CSR-only content is invisible to most crawlers, including AI crawlers); a
   real 404 for missing entities, no soft 404; the mobile-rendered DOM has the
   same content, headings, links and structured data as desktop (collapsed or
   accordion is fine, absent is not — mobile-first indexing).
9. **Sitemap** — the page appears in the XML sitemap with an accurate `lastmod`
   (`priority`/`changefreq` are ignored).

Record findings per page in `SEO-AUDIT-PROGRESS.md`: status per check, an Issues
list (P1/P2/P3), and concrete file-specific recommended fixes. Do not stop until
every `public-index` page has a row. Never silently cap coverage — if you sample
on a very large site, say so.

### Phase 3 — Prioritize into one backlog

Collapse all per-page findings into a single ordered checklist:

- **P1 — crawl/index blockers:** CSR-only content; uncrawlable pagination; soft
  404 or unbounded indexable URL space; `noindex`/`Disallow` on a page that
  should rank; indexable internal search; UGC links missing `rel="ugc"`;
  missing/duplicated title; broken canonical/hreflang.
- **P2 — correctness:** missing or invalid type-appropriate JSON-LD; duplicates
  without a cross-canonical; sitemap gaps or disallowed URLs listed; missing
  ItemList/BreadcrumbList.
- **P3 — hygiene/CWV polish:** missing image dimensions; eager/lazy mistakes;
  heading-order skips; schema-type refinements.

Order: **infrastructure P1 → page P1 → infrastructure P2 → page P2 → P3.** A fix
to the central metadata helper, sitemap generator, robots file, i18n/hreflang
builder or shared pagination component resolves the same issue across many pages
at once. Record deliberate skips with a reason tied to a rule — silent omissions
are not allowed.

Then compute the baseline scores (rubric below): first **self-recheck** a random
~15% (minimum 3 pages) of everything marked passing, against the actual rendered
output — not your notes. A failed spot-check is fixed and the sample expands.

### Phase 4 — Fix and verify

Loop until the backlog is empty:

1. Pick the next item (infra-first, P1 → P2 → P3).
2. Read the target file and surrounding code; match the project's existing
   patterns; reuse the central metadata helper — do not hand-roll a metadata
   object that drops canonical/hreflang.
3. Make the smallest correct change — one concern per edit; preserve
   translations, styling and SPA behavior.
4. Verify, in this order, every time: **typecheck → lint → build → observe the
   real rendered output** (grep the served HTML for the change, or load the
   route). Static checks alone are not proof for render/indexability changes.
5. Tick the item in `SEO-AUDIT-PROGRESS.md` with a one-line note + evidence.

Common fix recipes:

- CSR content invisible → fetch server-side (SSR/SSG/ISR) and pass initial props.
- Pagination → real `<a href="?page=n">`, self-canonical per page, drop
  `rel=next/prev` reliance.
- Soft 404 → real 404 for missing entities, or `noindex` placeholder pages.
- Indexable internal search → `noindex` when a free-text param is present; keep
  tag/sort/page indexable.
- UGC links → `rel="ugc nofollow"`; paid → `rel="sponsored"`.
- Missing JSON-LD → baseline `WebPage`+`BreadcrumbList` everywhere plus
  type-appropriate schema of visible content; validate with the Rich Results
  Test.
- Duplicate URLs → one canonical + redirect to the primary URL.
- `noindex` page also `Disallow`-ed → remove the Disallow; keep the meta /
  `X-Robots-Tag` noindex.
- Redirect chain or loop → repoint internal links and canonicals directly at the
  final URL; collapse to a single 301.
- Multiple live hosts → pick one canonical host, 301 every `http`/`www`/
  trailing-slash variant, and use it directly in links and canonicals.
- Sitemap → cover exactly the `public-index` set, no disallowed URLs, accurate
  `lastmod`; split + sitemap index if over 50k URLs.
- New domain or large new section with far more candidates than indexed →
  sitemap ramp: seed the best few hundred pages, then small batches (5–10 URLs
  every 1–3 days) admitted only when they pass the index threshold, paused when
  *Discovered/Crawled – currently not indexed* grows; pages waiting their turn
  stay unpublished or `noindex`.
- Images/CLS → `width`/`height`; LCP image eager + `fetchpriority=high`;
  below-fold lazy.
- hreflang → bidirectional, self-referential, `x-default`, valid ISO codes.
- Mobile parity → restore content hidden by breakpoint `display:none` or a
  lighter mobile template.
- AI crawlers → once the project's training-vs-citation decision is made,
  address them deliberately in robots.txt: a named group per decision, e.g.
  `Disallow: /` for GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
  Meta-ExternalAgent, CCBot (training opt-out, does not affect Search) while
  `Allow`-ing OAI-SearchBot, Claude-SearchBot, PerplexityBot, DuckAssistBot (stay
  citable in AI answers); optionally `Content-Signal: search=yes, ai-input=yes,
  ai-train=no`. Remember a bot matching a named group ignores the `*` group
  entirely — repeat any `Disallow` the named group still needs. This is a
  business decision — record it, never default silently.
- Bing blocked or throttled → remove the accidental block and any large
  `Crawl-delay`; verify in Bing Webmaster Tools. For fast-changing sites, wire
  IndexNow into publish/update/delete (Google does not use it — keep the sitemap
  accurate too).
- Missing entity `sameAs` → add to the `Organization`/`Person` JSON-LD
  (Wikidata, LinkedIn, Crunchbase, socials), a substantive About page, and
  visible author bylines with credentials.

When the backlog is empty, recompute both scores and show the before → after
delta next to the baseline.

### Phase 5 — Live signals (optional)

Requires a live public URL AND an MCP-connected SEO data tool (e.g. RankParse).
If either is missing, write one line in the progress file saying which, and stop
— do not guess production behavior from source code. Otherwise sample the
homepage plus up to five more `public-index` pages (one per route pattern, one
per locale):

1. **Live page-SEO scrape** — diff title/description/canonical/robots/JSON-LD
   against Phase 2; a mismatch is a new finding (redirect chain, CDN/edge
   rewrite, environment config, middleware stripping).
2. **Live Core Web Vitals** — LCP/CLS/INP on mobile, scored Good / Needs
   Improvement / Poor — the only metrics with a scored threshold. Record TTFB/FCP
   for diagnostics only; never score them or file them as issues.
3. **Live sitemap** — page present with a plausible `lastmod`.
4. **Site health** (once per domain) — robots.txt including AI-crawler
   directives. HTTPS enforcement, HSTS and security headers are out of scope:
   record only if surfaced unprompted, never file as issues — they are not SEO
   ranking factors.
5. **Prioritization context** (optional) — domain authority/backlink data may
   reorder the backlog but is never written into the findings list.

New findings are appended to the same P1/P2/P3 backlog — do not start a second
list.

### Scoring rubric (compute at end of Phases 3, 4 and 5-if-run)

Hard rules: no **final** score without full coverage — label it
`(provisional — N/M pages audited)` otherwise; any page with an open P1 is capped
at 60/100 (same for a GEO-blocking finding); self-recheck before finalizing;
always show the per-category breakdown; always state the off-page caveat.

**SEO Score** — average across `public-index` pages:

| Category | Max | What earns full points |
|---|---:|---|
| Indexability & crawl foundation | 25 | Correct `index,follow`, no noindex+Disallow conflict, self-canonical, no redirect chains/loops, single consolidated HTTPS host, in an accurate sitemap |
| Rendering & mobile parity | 20 | Content in server HTML, real 404s, mobile DOM parity |
| Structured data | 15 | `WebPage`+`BreadcrumbList` baseline, type-appropriate schema, entity `sameAs` |
| Metadata quality | 10 | Unique title/description, complete OG/Twitter |
| Internationalization | 10 | hreflang set + `x-default` + valid ISO — if not multilingual, redistribute into Metadata (→20) |
| Headings, semantics & links | 10 | One `<h1>`, landmarks, crawlable links, real pagination, correct rels |
| Images | 5 | alt, dimensions, correct eager/lazy split |
| Core Web Vitals | 5 | LCP/CLS/INP "Good" — real field data if Phase 5 ran, else source heuristics labeled `(heuristic, not measured)` |

**GEO Score** — one per project:

| Category | Max | What earns full points |
|---|---:|---|
| AI crawler configuration | 20 | Deliberate training-vs-search robots.txt policy, not a silent template default |
| Extractable rendering | 20 | Same server-rendered requirement, re-scored — AI crawlers do not run JS |
| Extractable content structure | 15 | Sections lead with direct, self-contained, quotable answers; comparisons/enumerations as lists or tables |
| Entity authority | 20 | `Organization`/`Person` `sameAs`, substantive About page, author bylines with credentials |
| Classic-SEO prerequisite | 15 | `round(SEO Score × 0.15)` — AI answers tend to cite pages that already rank |
| No wasted GEO effort | 10 | No `llms.txt`-as-fix or other unsourced AI-SEO tactic (an existing `llms.txt` kept for other services costs nothing — Google says it neither harms nor helps) |

## Output format

Two living files at the project root, plus the final report:

1. `ROUTES-INVENTORY.md` — every route classified (route | current → correct |
   rendering | notes), ending with the mismatches list.
2. `SEO-AUDIT-PROGRESS.md` — Stack Report; per-page findings; the P1/P2/P3
   backlog with deliberate skips; score tables (baseline + post-fix); a
   verification log (item | change | evidence); and a final summary table
   (page/area | what changed | verification evidence).
3. Final scores — both category breakdowns, coverage status (final vs
   provisional — N/M), and the caveat that these are technical readiness scores,
   not a ranking or traffic guarantee — off-page factors (backlinks, content
   quality, competition) are out of scope.

Done means, with evidence for each: every route classified; every `public-index`
page audited and resolved (unique title/description, self-canonical + hreflang if
multilingual, `index,follow`, at least one type-appropriate JSON-LD block of
visible content, exactly one `<h1>`, crawlable internal links, server-rendered
content); every `public-noindex` page emits `noindex`; private routes blocked and
absent from the sitemap; the sitemap covers exactly `public-index` with accurate
`lastmod`; typecheck/lint/build pass and changed routes were rendered and
checked; Phase 5 ran or was explicitly skipped with a reason; both scores
reported with breakdowns and the caveat.

## Guardrails

- You may modify repository files — that is the point of Phase 4. Keep changes
  minimal and consistent with existing patterns.
- Never break the build: typecheck, lint and build after every change; fix
  failures before moving on.
- Evidence over assertion: a fix only counts once you have seen it in the
  rendered output.
- Do not invent facts about Google: use only the rules in this prompt and
  official search-engine documentation; otherwise say "not covered." Never
  recommend meta keywords, `llms.txt` as a fix, FID (use INP), or `rel=next/prev`
  reliance.
- Respect intent: `public-index` ≠ `public-noindex` ≠ `private`. When a route's
  publicity or the AI-crawler policy is a business decision, ask that one
  specific question and keep going on everything else.
- Only mark up visible content in structured data; do not keyword-stuff or remove
  content to chase rankings.
- Never `Disallow` a URL you want `noindex`-ed; never file HTTPS/HSTS/security
  headers or domain authority as SEO issues.
- Persist progress to the two files continuously so a reset resumes cleanly; on
  resume, re-verify ~15% of already-ticked items against rendered output before
  trusting them.
