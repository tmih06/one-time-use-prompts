import { getPrompts } from "./prompts";

/**
 * Usage numbers for the public analytics and trending views, read from
 * PostHog once per build (like the star count in stars.ts). Null when the
 * PostHog read credentials aren't set or the query fails, so callers simply
 * leave the section out.
 *
 * Needs POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY (a secret, read-only
 * "query" scope); POSTHOG_APP_HOST defaults to the US cloud. See ANALYTICS.md.
 */

export interface TrendingPrompt {
  id: string;
  /** Distinct visitors who opened the prompt in the window. */
  viewers: number;
  /** Distinct visitors who copied it, counting only those with a view in the same session. */
  copiers: number;
  score: number;
}

export interface DailyPoint {
  /** YYYY-MM-DD in the PostHog project's timezone. */
  day: string;
  promptViews: number;
  /** Distinct (visitor, prompt) copies. */
  promptCopies: number;
}

export interface AnalyticsSnapshot {
  generatedAt: string;
  trendingDays: number;
  trending: TrendingPrompt[];
  daily: DailyPoint[];
}

const TRENDING_DAYS = 7;
const DAILY_DAYS = 30;
/** A copy says more about intent than a view does. */
const COPY_WEIGHT = 5;
const TRENDING_LIMIT = 20;

const BOT = "NOT isLikelyBot(coalesce(properties.$raw_user_agent, properties.$user_agent))";

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
    AND ${BOT}
  GROUP BY prompt_id, distinct_id, session_id
)
GROUP BY prompt_id`;

const dailyQuery = (days: number) => `
SELECT toString(toDate(timestamp)) AS day,
  countIf(event = 'prompt_view') AS prompt_views,
  uniqIf((distinct_id, properties.prompt_id), event = 'prompt_copy') AS prompt_copies
FROM events
WHERE event IN ('prompt_view', 'prompt_copy')
  AND timestamp >= now() - INTERVAL ${days} DAY
  AND ${BOT}
GROUP BY day
ORDER BY day`;

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

async function fetchAnalytics(): Promise<AnalyticsSnapshot | null> {
  const project = process.env.POSTHOG_PROJECT_ID;
  const token = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!project || !token) return null;
  const host = (process.env.POSTHOG_APP_HOST ?? "https://us.posthog.com").replace(/\/$/, "");
  try {
    const [trendingRows, dailyRows] = await Promise.all([
      hogql(host, project, token, trendingQuery(TRENDING_DAYS)),
      hogql(host, project, token, dailyQuery(DAILY_DAYS)),
    ]);
    // Anyone can send events with the public key, so ignore ids that aren't real prompts.
    const known = new Set(getPrompts().map((p) => p.id));
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
    const daily = dailyRows.map(([day, promptViews, promptCopies]) => ({
      day: String(day),
      promptViews: Number(promptViews),
      promptCopies: Number(promptCopies),
    }));
    return { generatedAt: new Date().toISOString(), trendingDays: TRENDING_DAYS, trending, daily };
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
    return null;
  }
}

export const analytics = await fetchAnalytics();
