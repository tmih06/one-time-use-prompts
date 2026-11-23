import { sampleSnapshot } from "./analytics-sample";
import { source } from "./source";

/**
 * Usage numbers for the public analytics, trending and per-prompt graphs, read
 * once per build (like the star count in stars.ts). Null when the PostHog read
 * credentials aren't set, the query fails, or nothing has happened yet, so
 * callers simply leave their section out. Once it is non-null the graphs always
 * render, showing zeros until traffic arrives, so they are visible while testing.
 *
 * Prompt views and copies come from PostHog (POSTHOG_PROJECT_ID,
 * POSTHOG_PERSONAL_API_KEY, optional POSTHOG_APP_HOST). Site visits come from
 * Cloudflare Web Analytics (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN,
 * CLOUDFLARE_WEB_ANALYTICS_SITE_TAG) and are optional. See ANALYTICS.md.
 */

export interface TrendingPrompt {
  id: string;
  /** Distinct visitors who opened the prompt in the window. */
  viewers: number;
  /** Distinct visitors who copied it, counting only those with a view in the same session. */
  copiers: number;
  score: number;
}

export interface PromptSeries {
  /** One entry per day in `AnalyticsSnapshot.days`. */
  views: number[];
  /** Distinct visitors who copied the prompt that day. */
  copies: number[];
}

export interface AnalyticsSnapshot {
  generatedAt: string;
  /** UTC dates (YYYY-MM-DD), oldest first; every series below has one value per date. */
  days: string[];
  trendingDays: number;
  trending: TrendingPrompt[];
  totals: {
    promptViews: number[];
    promptCopies: number[];
    /** Null when Cloudflare isn't configured or its query failed. */
    visits: number[] | null;
  };
  perPrompt: Record<string, PromptSeries>;
}

const TRENDING_DAYS = 7;
const DAILY_DAYS = 30;
/** A copy says more about intent than a view does. */
const COPY_WEIGHT = 5;
const TRENDING_LIMIT = 20;

const BOT = "NOT isLikelyBot(coalesce(properties.$raw_user_agent, properties.$user_agent))";
/** Local previews and tests send real events too; they are not traffic. */
const NOT_LOCAL =
  "NOT match(coalesce(properties.$host, ''), '^(localhost|127\\\\.0\\\\.0\\\\.1)(:|$)')";

/** One row per prompt. A copy only counts if the same session also viewed the prompt. */
const trendingQuery = (days: number) => `
SELECT prompt_id,
  uniqIf(distinct_id, views > 0) AS viewers,
  uniqIf(distinct_id, views > 0 AND copies > 0) AS copiers
FROM (
  SELECT properties.prompt_id AS prompt_id, distinct_id, properties.$session_id AS session_id,
    countIf(event = 'prompt_view') AS views,
    countIf(event = 'prompt_copy') AS copies
  FROM events
  WHERE event IN ('prompt_view', 'prompt_copy')
    AND timestamp >= now() - INTERVAL ${days} DAY
    AND properties.prompt_id IS NOT NULL
    AND ${NOT_LOCAL}
    AND ${BOT}
  GROUP BY prompt_id, distinct_id, session_id
)
GROUP BY prompt_id`;

/** One row per prompt per UTC day. */
const dailyQuery = (days: number) => `
SELECT toString(toDate(toTimeZone(timestamp, 'UTC'))) AS day,
  properties.prompt_id AS prompt_id,
  countIf(event = 'prompt_view') AS views,
  uniqIf(distinct_id, event = 'prompt_copy') AS copies
FROM events
WHERE event IN ('prompt_view', 'prompt_copy')
  AND timestamp >= now() - INTERVAL ${days} DAY
  AND properties.prompt_id IS NOT NULL
  AND ${NOT_LOCAL}
  AND ${BOT}
GROUP BY day, prompt_id`;

/** Page loads grouped by day, from Cloudflare Web Analytics (RUM). */
const VISITS_QUERY =
  "query($account:String!,$site:String!,$since:Time!,$until:Time!){viewer{accounts(filter:{accountTag:$account}){series:rumPageloadEventsAdaptiveGroups(limit:100,filter:{siteTag:$site,datetime_geq:$since,datetime_leq:$until},orderBy:[date_ASC]){sum{visits}dimensions{date}}}}}";

/**
 * A server-side setting. Astro's dev server reads `.env` into `import.meta.env` but
 * not `process.env`, while a build started through bun has it the other way round.
 */
const env = (name: string): string | undefined =>
  (import.meta.env[name] as string | undefined) || process.env[name];

/** Compact count: 987 → "987", 1234 → "1.2k". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
}

type Row = (string | number)[];

async function hogql(host: string, project: string, token: string, query: string): Promise<Row[]> {
  const res = await fetch(`${host}/api/projects/${project}/query/`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`PostHog query failed: ${res.status}`);
  const { results } = (await res.json()) as { results?: Row[] };
  return results ?? [];
}

/** The last `n` UTC dates, oldest first, ending today. */
function lastDays(n: number): string[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (n - 1 - i)))
      .toISOString()
      .slice(0, 10),
  );
}

interface VisitsResponse {
  data?: {
    viewer?: {
      accounts?: { series?: { sum: { visits: number }; dimensions: { date: string } }[] }[];
    };
  };
  errors?: { message: string }[];
}

/**
 * Cloudflare quietly returns no rows for a window longer than about 9 days (no error),
 * so ask for the days in chunks of at most a week and merge them.
 */
const VISITS_CHUNK_DAYS = 7;

async function fetchVisits(days: string[]): Promise<number[] | null> {
  const account = env("CLOUDFLARE_ACCOUNT_ID");
  const token = env("CLOUDFLARE_API_TOKEN");
  const site = env("CLOUDFLARE_WEB_ANALYTICS_SITE_TAG");
  if (!account || !token || !site) return null;

  const chunks: { since: string; until: string }[] = [];
  for (let i = 0; i < days.length; i += VISITS_CHUNK_DAYS) {
    const last = Math.min(i + VISITS_CHUNK_DAYS, days.length) - 1;
    chunks.push({
      since: `${days[i]}T00:00:00Z`,
      // The final chunk runs to now, so today's visits so far are included.
      until: last === days.length - 1 ? new Date().toISOString() : `${days[last]}T23:59:59Z`,
    });
  }

  try {
    const byDay = new Map<string, number>();
    await Promise.all(
      chunks.map(async ({ since, until }) => {
        const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: VISITS_QUERY, variables: { account, site, since, until } }),
          signal: AbortSignal.timeout(15000),
        });
        const json = (await res.json()) as VisitsResponse;
        if (!res.ok || json.errors?.length) {
          throw new Error(`Cloudflare query failed: ${json.errors?.[0]?.message ?? res.status}`);
        }
        for (const r of json.data?.viewer?.accounts?.[0]?.series ?? []) {
          byDay.set(r.dimensions.date, r.sum.visits);
        }
      }),
    );
    return days.map((day) => byDay.get(day) ?? 0);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
    return null;
  }
}

async function fetchAnalytics(): Promise<AnalyticsSnapshot | null> {
  const project = env("POSTHOG_PROJECT_ID");
  const token = env("POSTHOG_PERSONAL_API_KEY");
  if (!project || !token) return null;
  const host = (env("POSTHOG_APP_HOST") ?? "https://us.posthog.com").replace(/\/$/, "");
  const days = lastDays(DAILY_DAYS);
  try {
    const [trendingRows, dailyRows, visits] = await Promise.all([
      hogql(host, project, token, trendingQuery(TRENDING_DAYS)),
      hogql(host, project, token, dailyQuery(DAILY_DAYS)),
      fetchVisits(days),
    ]);
    // Anyone can send events with the public key, so ignore ids that aren't real prompts.
    const known = new Set(promptIds());
    const trending = trendingRows
      .map(([id, viewers, copiers]) => ({
        id: String(id),
        viewers: Number(viewers),
        copiers: Number(copiers),
        score: Number(viewers) + COPY_WEIGHT * Number(copiers),
      }))
      .filter((p) => known.has(p.id))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, TRENDING_LIMIT);

    const dayIndex = new Map(days.map((day, i) => [day, i]));
    const perPrompt: Record<string, PromptSeries> = {};
    const promptViews = days.map(() => 0);
    const promptCopies = days.map(() => 0);
    for (const [day, id, views, copies] of dailyRows) {
      const i = dayIndex.get(String(day));
      if (i === undefined || !known.has(String(id))) continue;
      const series = (perPrompt[String(id)] ??= {
        views: days.map(() => 0),
        copies: days.map(() => 0),
      });
      series.views[i] = Number(views);
      series.copies[i] = Number(copies);
      promptViews[i] += Number(views);
      promptCopies[i] += Number(copies);
    }

    return {
      generatedAt: new Date().toISOString(),
      days,
      trendingDays: TRENDING_DAYS,
      trending,
      totals: { promptViews, promptCopies, visits },
      perPrompt,
    };
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
    return null;
  }
}

/** Slugs of every real prompt page. */
function promptIds(): string[] {
  return source
    .getPages()
    .filter((p) => p.slugs.length === 3)
    .map((p) => p.slugs[2]);
}

// `ANALYTICS_SAMPLE=1` on the dev server shows made-up numbers. A build never does.
export const analytics =
  import.meta.env.DEV && env("ANALYTICS_SAMPLE")
    ? sampleSnapshot(promptIds())
    : await fetchAnalytics();
