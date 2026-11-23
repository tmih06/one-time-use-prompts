# SEO + GEO audit progress

## Stack report

- **Framework:** Astro 7.4 (`output: "static"`, `build.format: "file"`), React 19 islands for build-time rendering only, Fumadocs UI/Core for layout and search, Tailwind 4. Bun workspace; deploy to Cloudflare Pages (`wrangler pages deploy`, output `site/dist`).
- **Rendering:** fully static HTML. All content (prompt body, cards, nav) is in the initial HTML. Search index is a static JSON fetched on demand. Only the search dialog and small vanilla scripts run in the browser. Indexability risk from rendering: none.
- **Routing:** file routes `src/pages/index.astro`, `prompts/[...slug].astro` (gallery for depth < 3, prompt page at depth 3), `[...file].ts` (llms/.md), `og/prompts/[...path].ts`, `api/search.ts`, `404.astro`.
- **i18n:** none (English, single locale). Internationalization category is redistributed into Metadata (→ 20 points).
- **SEO infrastructure at baseline:** none. One layout (`src/layouts/base.astro`) emitted a constant `<title>`, an optional description and a relative `og:image`. No canonical, sitemap, robots.txt, JSON-LD, Twitter tags.
- **Site maturity:** production at https://prompts.one-time-use.com; 12 candidate indexable URLs (small), so no sitemap ramp needed. Search Console data not provided.
- **Vertical:** content library / publisher (prompt catalogue; each prompt is a short technical document). Schema used: `TechArticle`, `CollectionPage` + `ItemList`, `WebSite`, `BreadcrumbList`.
- **Verification commands:** `bun run typecheck` (root tsc + site tsc), `bun run lint` (vp lint), `bun run build` (sync + astro build).
- **Live baseline (https://prompts.one-time-use.com, 2026-11-23):** `/`, `/prompts` and a prompt page return 200 with the generic title; `/sitemap.xml` and `/sitemap-index.xml` return 404; `/prompts/nope` returns a real 404; `http://` → 301 to https; `/prompts/` → 308 to `/prompts`; `/index.html` → 308 to `/`; `www.` host does not resolve. `robots.txt` is only Cloudflare's managed comment block (content-signal definitions) with no User-agent, Allow, Disallow, Sitemap or Content-Signal lines. Host and HTTPS consolidation are fine. The `npx github:umutxyp/Seo-Promt-Master` scanner could not run: this machine's npm config refuses git-hosted packages (`EALLOWGIT`), and I did not override that setting. Per the prompt's fallback I fetched robots.txt, the sitemap path, the homepage and inner pages by hand, and inspected the built HTML for every route.

## Baseline scores (before changes)

Coverage: 12/12 `public-index` pages audited (final, not provisional). Scores were computed from the baseline build and the live fetches above.

| SEO category                              |     Max | Baseline |
| ----------------------------------------- | ------: | -------: |
| Indexability & crawl foundation           |      25 |       10 |
| Rendering & mobile parity                 |      20 |       20 |
| Structured data                           |      15 |        0 |
| Metadata quality (i18n folded in)         |      20 |        3 |
| Headings, semantics & links               |      10 |        9 |
| Images                                    |       5 |        5 |
| Core Web Vitals (heuristic, not measured) |       5 |        4 |
| **SEO total**                             | **100** |   **51** |

Every page had an open P1 (duplicate title) → per-page cap of 60 did not bind (51 < 60).

| GEO category                                 |     Max | Baseline |
| -------------------------------------------- | ------: | -------: |
| AI crawler configuration                     |      20 |        2 |
| Extractable rendering                        |      20 |       20 |
| Extractable content structure                |      15 |        8 |
| Entity authority                             |      20 |        4 |
| Classic-SEO prerequisite (round(SEO × 0.15)) |      15 |        8 |
| No wasted GEO effort                         |      10 |       10 |
| **GEO total**                                | **100** |   **52** |

## Per-page findings (9-point check, baseline)

Legend: ok / FAIL / n/a. Checks: 1 metadata, 2 canonical/host, 3 robots, 4 structured data, 5 headings, 6 images, 7 links, 8 rendering, 9 sitemap.

| Page                                                 | 1                                       | 2                   | 3   | 4    | 5   | 6   | 7   | 8   | 9    |
| ---------------------------------------------------- | --------------------------------------- | ------------------- | --- | ---- | --- | --- | --- | --- | ---- |
| `/`                                                  | FAIL (generic title; og:title only)     | FAIL (no canonical) | ok  | FAIL | ok  | ok  | ok  | ok  | FAIL |
| `/prompts`                                           | FAIL (generic title; relative og:image) | FAIL                | ok  | FAIL | ok  | ok  | ok  | ok  | FAIL |
| `/prompts/existing`                                  | FAIL                                    | FAIL                | ok  | FAIL | ok  | ok  | ok  | ok  | FAIL |
| `/prompts/existing/{quality,operations,maintenance}` | FAIL (no og:image)                      | FAIL                | ok  | FAIL | ok  | ok  | ok  | ok  | FAIL |
| 6 prompt pages                                       | FAIL (generic title, no description)    | FAIL                | ok  | FAIL | ok  | ok  | ok  | ok  | FAIL |

Common notes: exactly one `<h1>` and a `<main>` on every page; author avatars are decorative (`alt=""`, explicit width/height, lazy) and there is no LCP image, so no eager/lazy issue; all cards and links are real `<a href>`; there is no pagination (all cards in one page).

## Backlog (all items done)

Order: infrastructure P1 → page P1 → infrastructure P2 → page P2 → P3.

- [x] **P1 infra** Central metadata in `src/layouts/base.astro`: per-page title, description, absolute self-canonical, `robots`, complete OG + Twitter with absolute image. Evidence: V1.
- [x] **P1 page** `index.astro`, `prompts/[...slug].astro`, `404.astro` pass title/description/path/image to the layout (titles and descriptions built in `src/lib/seo.ts`). Evidence: V1.
- [x] **P2 infra** `/sitemap.xml` (`src/pages/sitemap.xml.ts`) with exactly the 12 public-index URLs and `lastmod` from each prompt's last commit; `public/robots.txt` with `Sitemap:` and `Disallow: /api/`. Evidence: V2.
- [x] **P2 infra** JSON-LD (`pageGraph` in `src/lib/seo.ts`): `WebSite` + `CollectionPage`/`WebPage` + `BreadcrumbList` everywhere; `ItemList` on home/browse pages; `TechArticle` on prompt pages. Evidence: V3.
- [x] **P2 infra** `X-Robots-Tag: noindex` on `/*.md` twins via `public/_headers`. Evidence: V4.
- [x] **P3** `<html lang="en">`; 404 `noindex` + own title; `document.title` follows gallery filtering (`data-titles` + `scripts/gallery.ts`). Evidence: V1, source diff.

### Owner decisions

1. **AI training vs. citation policy: (a) stay fully open** (decided by the owner). `robots.txt` allows every crawler, AI training and citation bots included, and says so in a comment. No named groups and no `Content-Signal` line; Cloudflare's managed content-signal comment block on the live site is separate from this file.
2. **Entity facts (About page, `Person`/`Organization` `sameAs`, byline credentials): skipped by the owner.** Nothing invented; this caps Entity authority.

### Deliberate skips

- No IndexNow: 12 static pages deployed rarely; Google does not use it, Bing discovers via the sitemap.
- `/prompts` and `/prompts/existing` list the same prompts today. Both keep self-canonicals: titles, H1, breadcrumbs and intent differ, and the sets diverge when `creation` prompts are added. Cost: 1 point in indexability.
- No `llms.txt` work; the Fumadocs-generated file is left as is (Google says it neither helps nor harms).
- No FAQPage or review/rating markup (no visible FAQ or reviews). No `Organization`/`Person` publisher node: its name is not visible on the page (guardrail: mark up visible content only).
- AI-model-authored prompts get no `author` in JSON-LD (a model is not a Person or Organization).
- No hreflang (single locale). No sitemap ramp (12 URLs). Heading-order note: browse pages go h1 → h3 (card titles); accessibility note only, not changed.
- Security headers/HSTS: not SEO, not filed.

## Verification log

All checks run after the final change: `bun run typecheck` pass; `bun run lint` 0 warnings after removing an unused import in `gallery.tsx`; `bun run build` pass (13 pages). `bun run check` (format) fails only on `site/src/lib/analytics.ts`, a file someone else is editing in this tree and not part of this work.

| #   | Item                                                      | Change                                | Evidence                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | Titles, descriptions, canonical, OG/Twitter, lang, robots | `base.astro`, pages, `lib/seo.ts`     | Parsed `dist/**/*.html` for all 13 pages: 13 distinct titles, description on every page, canonical equals `https://prompts.one-time-use.com` + route, absolute `og:image` (1200×630, verified from the WebP header), `twitter:card`, `lang="en"`, `index,follow` on 12 pages and `noindex,follow` on `/404`; exactly one `<h1>` each. |
| V2  | Sitemap + robots                                          | `sitemap.xml.ts`, `public/robots.txt` | Served by `wrangler pages dev`: `/sitemap.xml` 200 `application/xml`, 12 `<loc>`s that equal the set of page canonicals exactly (no 404, `.md`, `/api`); `lastmod` taken from each prompt's last commit and the max of children, compared as instants; `/robots.txt` 200 with `Sitemap:`.                                             |
| V3  | JSON-LD                                                   | `pageGraph`                           | Every page's graph parses; all `{"@id"}` references resolve inside the graph; breadcrumb names, ItemList names, headline and byline were found in the visible text of 3 sampled pages (prune-tests, untangle-codebase, quality), after decoding `&#x27;`.                                                                             |
| V4  | `.md` twins                                               | `_headers`                            | `wrangler pages dev`: `/prompts.md` and `/prompts/.../prune-tests.md` return `x-robots-tag: noindex`; HTML pages do not; `.md` is not Disallowed.                                                                                                                                                                                     |
| V5  | Links and redirects                                       | n/a                                   | Every internal `<a href="/…">` on all 12 pages resolves to a built page (0 broken); `/prompts/` → 308 `/prompts` is not linked anywhere; `/prompts/nope` → real 404.                                                                                                                                                                  |
| V6  | Self-recheck                                              | n/a                                   | Re-verified 3 of 12 "passing" pages (25%) against rendered HTML rather than notes; server HTML contains the full prompt text (7.5–12.7 kB of visible text). One false alarm (entity-encoded apostrophe) was my checker, not the page.                                                                                                 |

## Final scores (after fixes)

Coverage: 12/12 `public-index` pages audited and resolved → **final**. Scores come from the local build; live production has not been redeployed yet, so the live checks in Phase 0 still describe the old site until you deploy.

| SEO category                              |     Max | Baseline |  After |
| ----------------------------------------- | ------: | -------: | -----: |
| Indexability & crawl foundation           |      25 |       10 |     24 |
| Rendering & mobile parity                 |      20 |       20 |     20 |
| Structured data                           |      15 |        0 |     12 |
| Metadata quality (i18n folded in)         |      20 |        3 |     20 |
| Headings, semantics & links               |      10 |        9 |      9 |
| Images                                    |       5 |        5 |      5 |
| Core Web Vitals (heuristic, not measured) |       5 |        4 |      4 |
| **SEO total**                             | **100** |   **51** | **94** |

Why not full: −1 indexability (`/prompts` ≈ `/prompts/existing` today); −3 structured data (no entity `sameAs` beyond the repo link; needs owner facts); −1 headings (h1 → h3 on browse pages); −1 CWV (not measured). No page has an open P1, so the 60 cap does not apply.

| GEO category                                |     Max | Baseline |  After |
| ------------------------------------------- | ------: | -------: | -----: |
| AI crawler configuration                    |      20 |        2 |      4 |
| Extractable rendering                       |      20 |       20 |     20 |
| Extractable content structure               |      15 |        8 |      8 |
| Entity authority                            |      20 |        4 |      7 |
| Classic-SEO prerequisite (round(94 × 0.15)) |      15 |        8 |     14 |
| No wasted GEO effort                        |      10 |       10 |     10 |
| **GEO total**                               | **100** |   **52** | **63** |

GEO headroom: AI crawler configuration is 16/20 because the open policy is deliberate and recorded but names no crawler groups; Entity authority stays low because the owner skipped the entity facts; content structure would need answer-first copy, which I did not rewrite.

**Phase 5 (live signals): skipped.** No MCP-connected SEO data tool (such as RankParse) is available in this session (connected: agentation, Claude Docs, easel), and the new build is not deployed, so production behaviour cannot be diffed. Core Web Vitals are therefore heuristic only.

**Caveat:** these are technical-readiness scores, not a ranking or traffic prediction. Backlinks, content quality and competition are off-page and out of scope.

## Summary

| Page / area                              | What changed                                                                                                     | Verification                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Layout (all 13 HTML pages)               | Unique title, description, absolute canonical, robots, OG + Twitter, `lang`                                      | V1                                        |
| `/`, `/prompts`, phase and purpose pages | Specific titles/descriptions, `CollectionPage` + `ItemList` + `BreadcrumbList`; purpose pages gained an OG image | V1, V3                                    |
| 6 prompt pages                           | Title = prompt title, description = catalog description, `TechArticle` with tags, modified date and byline       | V1, V3                                    |
| `/404`                                   | `noindex`, own title                                                                                             | V1                                        |
| Sitemap, robots.txt                      | New; 12 URLs, `Disallow: /api/`, `Sitemap:`                                                                      | V2                                        |
| `.md` twins                              | `X-Robots-Tag: noindex`                                                                                          | V4                                        |
| Gallery filtering                        | Tab title follows the URL                                                                                        | source diff (`gallery.ts`, `gallery.tsx`) |
