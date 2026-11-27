import type { CSSProperties } from "react";
import { AuthorLine } from "@/components/prompt-author";
import { LegendPill, UsageChart } from "@/components/usage-chart";
import { hue } from "@/components/prompt-tags";
import { formatCount } from "@/lib/analytics";
import { formatDate, type PromptSummary } from "@/lib/prompts";

/** The layered "shell around an inset well" card recipe used across the site. */
export const shell = "rounded-[1.375rem] bg-surface p-1.5";

/** Views and copies over the last two weeks, in tuffui's chart style: pill legend over a small line chart. */
function CardUsage({ stats }: { stats: NonNullable<PromptSummary["stats"]> }) {
  const label = `Last ${stats.days} days: ${stats.totalViews} views, ${stats.totalCopies} copies`;
  return (
    <div className="mt-auto pt-2">
      <div className="rounded-xl bg-surface-inset p-2.5" title={`Last ${stats.days} days`}>
        <div className="flex gap-1.5">
          <LegendPill color="var(--series-views)">
            <span className="font-mono tabular-nums">{formatCount(stats.totalViews)}</span> views
          </LegendPill>
          <LegendPill color="var(--series-copies)">
            <span className="font-mono tabular-nums">{formatCount(stats.totalCopies)}</span> copies
          </LegendPill>
        </div>
        <UsageChart
          className="mt-2"
          width={300}
          height={44}
          label={label}
          series={[
            { values: stats.views, color: "var(--series-views)" },
            { values: stats.copies, color: "var(--series-copies)" },
          ]}
        />
      </div>
    </div>
  );
}

/** Gallery card: a fading preview of the prompt file, then title, blurb and tags. */
export function PromptCard({ prompt: p, hidden }: { prompt: PromptSummary; hidden?: boolean }) {
  return (
    <a
      href={`/prompts/${p.splat}`}
      data-reveal
      data-gallery-item
      data-gallery-prompt-id={p.id}
      data-phase={p.phase}
      data-purpose={p.purpose}
      hidden={hidden}
      className={`press lift group flex min-w-0 flex-col ${shell} hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]`}
    >
      <div className="relative flex aspect-[16/10] flex-col overflow-hidden rounded-2xl bg-surface-inset p-4 font-mono text-[11px] leading-relaxed [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
        {/* The preview drifts up a few pixels on hover, hinting there's more below the fade. */}
        <div className="flex flex-col transition-transform duration-500 ease-[var(--ease-arrive)] group-hover:-translate-y-2">
          {p.preview.map((line, i) => (
            <span
              key={i}
              className={
                line.startsWith("#")
                  ? "text-brand"
                  : line.startsWith(">")
                    ? "text-muted-foreground"
                    : "text-foreground/80"
              }
            >
              {line || "\u00a0"}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 pb-2.5 pt-3">
        <h3 className="flex min-w-0 items-center gap-2 font-medium">
          <span className="truncate">{p.title}</span>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
        {p.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Tags">
            {p.tags.slice(0, 5).map((t) => (
              <li
                key={t}
                className="tag !h-5 !px-2 !text-[0.6875rem]"
                style={{ "--h": hue(t) } as CSSProperties}
              >
                #{t}
              </li>
            ))}
            {p.tags.length > 5 && (
              <li className="tag tag-neutral !h-5 !px-2 !text-[0.6875rem]">+{p.tags.length - 5}</li>
            )}
          </ul>
        )}
        {p.stats && <CardUsage stats={p.stats} />}
        {p.author ? (
          <AuthorLine
            author={p.author}
            updated={p.updated}
            className={`${p.stats ? "" : "mt-auto"} pt-2`}
          />
        ) : (
          <p
            className={`${p.stats ? "" : "mt-auto"} flex items-center justify-between gap-2 pt-2 text-[0.8125rem] text-muted-foreground/80`}
          >
            <span className="capitalize">
              {p.phase} · {p.purpose}
            </span>
            {p.updated && (
              <time dateTime={p.updated} title="Last updated" className="tabular-nums">
                {formatDate(p.updated)}
              </time>
            )}
          </p>
        )}
      </div>
    </a>
  );
}
