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

`import { analytics } from "@/lib/analytics"` gives `{ trending, daily, ... }` or `null` (no credentials, or the
query failed). It is read once per build, so the numbers are as fresh as the last deploy; redeploy on a schedule
to refresh them. Trending score is `viewers + 5 × copiers` over the last 7 days. Nothing renders it yet.
