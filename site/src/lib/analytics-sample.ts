import type { AnalyticsSnapshot } from "./analytics";

/**
 * Made-up usage so the graphs can be seen and styled before real traffic
 * exists. Only used by the dev server with ANALYTICS_SAMPLE=1 (see analytics.ts);
 * a build never uses it, so it can't reach a deployed site.
 */
export function sampleSnapshot(ids: string[]): AnalyticsSnapshot {
  const n = 30;
  const now = new Date();
  const days = Array.from({ length: n }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (n - 1 - i)))
      .toISOString()
      .slice(0, 10),
  );
  // Deterministic wiggle, so the shapes don't change on every reload.
  const wave = (base: number, amp: number, seed: number) =>
    days.map((_, i) =>
      Math.max(
        0,
        Math.round(
          base + amp * Math.sin(i / 3 + seed) + (i / n) * base * 0.8 + ((i * 7 + seed * 13) % 5),
        ),
      ),
    );

  const perPrompt: AnalyticsSnapshot["perPrompt"] = {};
  ids.forEach((id, k) => {
    if (k === ids.length - 1) return; // the last one stays empty, to show that state
    const views = wave(Math.max(2, 7 - k), 3, k);
    perPrompt[id] = {
      views,
      copies: views.map((v, i) => Math.round(v / (i % 3 === 0 ? 4 : 6))),
    };
  });
  const total = (pick: "views" | "copies") =>
    days.map((_, i) => Object.values(perPrompt).reduce((a, s) => a + s[pick][i], 0));

  return {
    generatedAt: now.toISOString(),
    days,
    trendingDays: 7,
    trending: ids.slice(0, 5).map((id, k) => ({
      id,
      viewers: 42 - k * 7,
      copiers: 14 - k * 3,
      score: 42 - k * 7 + 5 * (14 - k * 3),
    })),
    totals: { promptViews: total("views"), promptCopies: total("copies"), visits: wave(40, 15, 2) },
    perPrompt,
  };
}
