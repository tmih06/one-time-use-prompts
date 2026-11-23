# Analytics

Anonymous usage tracking with [PostHog](https://posthog.com), for public analytics and trending prompts.
Without the env vars below, nothing is tracked and the site builds as before.

## What is tracked

| Event                     | When                                                     | Properties                      |
| ------------------------- | -------------------------------------------------------- | ------------------------------- |
| `prompt_view`             | A prompt page is shown                                   | `prompt_id`, `phase`, `purpose` |
| `prompt_copy`             | The prompt's copy button is used                         | `prompt_id`, `phase`, `purpose` |
| `gallery_filter_selected` | A visitor picks a phase or purpose filter in the gallery | the chosen filter               |

PostHog only handles these per-prompt events, and its SDK loads only on prompt pages. **Site-wide page visits come from
[Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/)**: enable it for the Pages project in the
Cloudflare dashboard (no code or script needed here). Its numbers are in the Cloudflare dashboard; showing them
publicly means reading Cloudflare's GraphQL Analytics API at build time, which isn't wired up yet.

No cookies (localStorage only), no autocapture, no session recording, no identified users, and Do Not Track is respected.
Code: `src/scripts/analytics.ts`, hooked up in `src/scripts/site.ts`; prompt pages carry `data-prompt-id` on `<main>`.

## Setup

1. Create a PostHog project and copy `site/.env.example` to `site/.env`.
2. Set `PUBLIC_POSTHOG_KEY` (project API key) and `PUBLIC_POSTHOG_HOST`. These ship to the browser by design.
3. To read the numbers back at build time, create a personal API key with read access to queries and set
   `POSTHOG_PROJECT_ID` and `POSTHOG_PERSONAL_API_KEY`. These are secrets: keep them out of the repo, and
   set them wherever the build runs (`bun run deploy` builds locally, so `site/.env` is enough).

Tracking is off in `bun run dev`.

## Copy count and spam

The public key can't be secret, so anyone can post fake events. The count is defended in layers:

- **Client:** a copy needs a trusted click, no `navigator.webdriver`, and counts once per prompt per session.
  The SDK also drops known bot user agents.
- **Query** (`src/lib/analytics.ts`): trending counts distinct visitors, not raw events; a copy only counts
  when the same session also has a `prompt_view` for that prompt; bot user agents are excluded; unknown
  `prompt_id` values are ignored.

If spam still gets through, put a small Pages Function in front of PostHog that checks a Cloudflare
Turnstile token and rate-limits by IP.

## Reading the numbers

`import { analytics } from "@/lib/analytics"` gives the snapshot below, or `null` when no read credentials are set or
a query failed. It is read once per build, so the numbers are as fresh as the last deploy; redeploy on a schedule to
refresh them.

| Field       | What it is                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------- |
| `trending`  | Top prompts over 7 days, scored `viewers + 5 × copiers` (distinct visitors; see spam notes) |
| `totals`    | Daily prompt views and copies for 30 days, plus `visits` from Cloudflare when configured    |
| `perPrompt` | The same daily series per prompt                                                            |

Events from `localhost` and `127.0.0.1` are excluded, so local testing never shows up as traffic.

## Where it shows

The panels and graphs render whenever the PostHog read credentials work, showing zeros and an empty trending list until
traffic arrives. With no credentials (or a failed query) they are left out and the site looks as before.

To see them filled in before there is real traffic, run the dev server with sample numbers:

```bash
ANALYTICS_SAMPLE=1 bun run dev
```

The sample data (`src/lib/analytics-sample.ts`) is only used by the dev server. A build ignores the flag, so it can't
reach a deployed site.

- **Home hero** (`components/analytics-panels.tsx`): two cards in the style of tuffui's components. "Trending" ranks the top
  prompts of the week with striped bars; "Usage" is a 30-day line chart of prompt views and copies with a change
  badge and Visits / Views / Copies tiles. On very wide screens (2xl) they sit in the empty space either side of the
  headline; below that they stack under the buttons.
- **Prompt cards** (`components/prompt-card.tsx`): a pill legend with the 14-day totals over a small line chart, in an
  inset well. Both lines share one scale, so copies read as the smaller number they are.
- **Colours:** views use the brand blue and copies tuffui's teal `#1a9e8c` (`--series-views`, `--series-copies` in
  `app.css`). The pair passes the data-viz validator on the card and well surfaces in light and dark. The one warning
  is teal on the light card surface (2.8:1), which the charts avoid by sitting in the inset wells, and the figures
  are also printed as text.

## Deploying (Cloudflare Pages)

The live site is a Git-connected Pages project: a push to `master` builds Production, other branches build Previews.
The numbers are read **at build time**, so the build needs the variables from `.env.example` (everything except
`ANALYTICS_SAMPLE`).

- **Set them as _Secret_, not _Text_.** The repo's `wrangler.jsonc` (`pages_build_output_dir`) makes Pages read its
  config from that file, and the build log then says `Build environment variables: (none found)`: plain-text dashboard
  variables never reach the build. Secrets do. The `PUBLIC_` ones end up in the public bundle either way.
- Production and Preview have separate variable sets. Only Production has them, so Preview builds show no graphs.
- A variable change only applies to the **next** build: use Retry deployment on the latest Production deployment.
- Don't deploy with `bun run deploy`; it targets whichever account wrangler is logged in to and the project is
  connected to Git. Push instead.
- To check a deploy: the page source should contain the Trending card and the bundle should contain the PostHog key.
  No graphs and no build warning means the variables were missing, since the graphs are left out silently.

## Site visits (Cloudflare)

Visits come from Cloudflare Web Analytics, not PostHog, and are optional:

1. Enable Web Analytics for the Pages project in the Cloudflare dashboard.
2. Create an API token with Account Analytics read access and note your account ID.
3. Find the site's tag. It is the `site_tag` of your site in the Web Analytics API, **not** the `site_token` inside the beacon
   snippet. List your sites and copy the `site_tag` whose hostname matches (the token may also need
   Account → Web Analytics → Read for this call):

   ```bash
   curl -s https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/rum/site_info/list \
     -H "Authorization: Bearer <API_TOKEN>"
   ```

4. Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG`.

The GraphQL query in `src/lib/analytics.ts` (`VISITS_QUERY`) was checked against a real account. Two things to know:

- Cloudflare returns **no rows, with no error**, for a window longer than about 9 days, so the code asks for the 30 days in
  chunks of 7 and merges them.
- An account can hold more than one Web Analytics site for the same hostname (each has its own `site_tag`). Use the one
  that is collecting your traffic; list them with the call above, or compare page loads per `siteTag` in the GraphQL API.

If a query fails the build logs "Cloudflare query failed: ..." and the visits tile is left out. Everything else keeps working.
