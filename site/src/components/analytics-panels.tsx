import { ArrowDownRight, ArrowUpRight, ChartColumn, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { LegendPill, UsageChart } from "@/components/usage-chart";
import { formatCount, type AnalyticsSnapshot } from "@/lib/analytics";
import type { PromptSummary } from "@/lib/prompts";

const TRENDING_SHOWN = 5;

/** tuffui's card: a raised shell, a header, and a darker well that holds the content. */
const card =
  "w-full rounded-[1.375rem] bg-surface p-1.5 text-left 2xl:absolute 2xl:inset-y-0 2xl:my-auto 2xl:h-fit 2xl:w-72";
const well = "rounded-2xl bg-surface-inset p-3";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

function CardHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-3 pb-3 pt-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-medium leading-tight">{title}</h2>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {right}
    </header>
  );
}

/** Change against the previous half of the window; hidden when there is nothing to compare. */
function Delta({ values }: { values: number[] }) {
  const half = Math.floor(values.length / 2);
  const before = sum(values.slice(0, half));
  const now = sum(values.slice(half));
  if (before === 0) return null;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span
      className={`mt-1.5 inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[0.6875rem] font-medium tabular-nums [&_svg]:size-3 ${
        up
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-foreground/[0.06] text-muted-foreground"
      }`}
    >
      {up ? <ArrowUpRight aria-hidden /> : <ArrowDownRight aria-hidden />}
      {up ? "+" : ""}
      {pct}%
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface px-2.5 py-2">
      <dt className="text-[0.6875rem] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-[0.9375rem] tabular-nums">{formatCount(value)}</dd>
    </div>
  );
}

/**
 * Public usage in the hero, as two cards in tuffui's style. Stacked under the
 * buttons on narrower screens; on very wide ones they sit in the empty space either
 * side of the headline, which the hero needs to be `relative` for.
 */
export function HeroAnalytics({
  snapshot,
  prompts,
}: {
  snapshot: AnalyticsSnapshot;
  prompts: PromptSummary[];
}) {
  const byId = new Map(prompts.map((p) => [p.id, p]));
  const trending = snapshot.trending.filter((t) => byId.has(t.id)).slice(0, TRENDING_SHOWN);
  const top = Math.max(1, ...trending.map((t) => t.score));
  const { visits, promptViews, promptCopies } = snapshot.totals;
  const views = sum(promptViews);
  const copies = sum(promptCopies);
  const span = snapshot.days.length;

  return (
    <div className="mt-12 grid w-full max-w-3xl grid-cols-[minmax(0,1fr)] items-start gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))] 2xl:contents">
      <section data-reveal aria-labelledby="trending-title" className={`${card} 2xl:left-8`}>
        <CardHeader
          icon={<TrendingUp aria-hidden />}
          title="Trending"
          subtitle="This week, by views and copies"
        />
        <div className={well}>
          {trending.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Nothing yet. Prompts appear here as they get views.
            </p>
          ) : (
            <ol className="flex flex-col gap-3.5">
              {trending.map((t, i) => {
                const p = byId.get(t.id)!;
                return (
                  <li key={t.id}>
                    <a
                      href={`/prompts/${p.splat}`}
                      title={p.title}
                      className="press group block rounded-lg"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="w-3 font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:underline">
                          {p.title}
                        </span>
                      </span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                        <span
                          className="stripes block h-full rounded-full"
                          style={{
                            width: `${Math.max(4, (t.score / top) * 100)}%`,
                            backgroundColor: "var(--series-views)",
                          }}
                        />
                      </span>
                      <span className="mt-1.5 flex justify-between text-[0.6875rem] text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          {formatCount(t.viewers)} {t.viewers === 1 ? "viewer" : "viewers"}
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatCount(t.copiers)} copied
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <section data-reveal aria-labelledby="usage-title" className={`${card} 2xl:right-8`}>
        <CardHeader
          icon={<ChartColumn aria-hidden />}
          title="Usage"
          subtitle={`Last ${span} days`}
          right={
            <div className="flex flex-col items-end">
              <p className="text-xl font-semibold leading-none tabular-nums">
                {formatCount(views)}
              </p>
              <Delta values={promptViews} />
            </div>
          }
        />
        <div className={well}>
          <div className="flex gap-1.5">
            <LegendPill color="var(--series-views)">Views</LegendPill>
            <LegendPill color="var(--series-copies)">Copies</LegendPill>
          </div>
          <UsageChart
            className="mt-3"
            axis
            days={snapshot.days}
            emptyText="No activity yet"
            label={`Last ${span} days: ${views} prompt views and ${copies} copies`}
            series={[
              { values: promptViews, color: "var(--series-views)" },
              { values: promptCopies, color: "var(--series-copies)" },
            ]}
          />
          <dl className={`mt-3 grid gap-1.5 ${visits ? "grid-cols-3" : "grid-cols-2"}`}>
            {visits && <Stat label="Visits" value={sum(visits)} />}
            <Stat label="Views" value={views} />
            <Stat label="Copies" value={copies} />
          </dl>
        </div>
      </section>
    </div>
  );
}
