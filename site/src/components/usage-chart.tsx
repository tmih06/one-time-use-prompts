import { useId } from "react";
import { formatCount } from "@/lib/analytics";

export interface ChartSeries {
  values: number[];
  /** Any CSS colour, usually a var(--series-*) token. */
  color: string;
}

interface UsageChartProps {
  series: ChartSeries[];
  /** Name for assistive tech, including the figures the lines show. */
  label: string;
  /** UTC dates, one per value; the first and last label the x axis when `axis` is on. */
  days?: string[];
  /** Show a y scale and the first/last date. Off for the small card version. */
  axis?: boolean;
  /** Shown over the plot when every value is zero. */
  emptyText?: string;
  /** Plot size in viewBox units; the SVG scales to its container. */
  width?: number;
  height?: number;
  className?: string;
}

const DOT = 4;
const RING = 2;

/** 4 for small counts, else the next 1, 2 or 5 × 10ⁿ, so gridlines land on round numbers. */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** A line through every point, rounded off at the corners with quadratic curves between midpoints. */
function linePath(pts: [number, number][]): string {
  if (pts.length < 3) return pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return `${d} L${lx} ${ly}`;
}

const dateLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * Line chart in the style of tuffui's Chart Card: hairline grid, soft gradient under
 * each line, quiet 10px labels. Static SVG. All lines share one scale, so a smaller
 * series reads as smaller instead of being stretched to fill. The axis labels are HTML
 * placed by percentage, so their text never scales with the SVG.
 */
export function UsageChart({
  series,
  label,
  days,
  axis = false,
  emptyText,
  width = 240,
  height = 96,
  className,
}: UsageChartProps) {
  const uid = useId();
  const n = Math.max(...series.map((s) => s.values.length));
  const peak = Math.max(0, ...series.flatMap((s) => s.values));
  const max = niceMax(peak);
  const empty = peak === 0;

  const left = axis ? 26 : 4;
  const right = axis ? 8 : 4;
  const top = 6;
  const bottom = 6;
  const x = (i: number) => left + (n > 1 ? (i / (n - 1)) * (width - left - right) : 0);
  const y = (v: number) => height - bottom - (v / max) * (height - top - bottom);
  const ticks = axis ? [0, max / 2, max] : [0, max / 2];

  return (
    <div className={className}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
          className="block h-auto w-full text-foreground"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            {series.map((s, k) => (
              <linearGradient key={k} id={`${uid}-g${k}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <line
              key={t}
              x1={left}
              x2={width - right}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              strokeOpacity={t === 0 ? 0.18 : 0.08}
              strokeWidth={1}
            />
          ))}
          {!empty &&
            series.map((s, k) => {
              const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
              const line = linePath(pts);
              const [fx] = pts[0];
              const [lx, ly] = pts[pts.length - 1];
              return (
                <g key={k}>
                  <path
                    d={`${line} L${lx} ${y(0)} L${fx} ${y(0)} Z`}
                    fill={`url(#${uid}-g${k})`}
                    stroke="none"
                  />
                  <path d={line} stroke={s.color} strokeWidth={2} />
                  {axis && (
                    <circle
                      cx={lx}
                      cy={ly}
                      r={DOT}
                      fill={s.color}
                      stroke="var(--surface-inset)"
                      strokeWidth={RING}
                    />
                  )}
                </g>
              );
            })}
        </svg>
        {axis &&
          ticks.map((t) => (
            <span
              key={t}
              className="absolute left-0 -translate-y-1/2 text-[10px] tabular-nums leading-none text-muted-foreground"
              style={{ top: `${(y(t) / height) * 100}%` }}
            >
              {formatCount(t)}
            </span>
          ))}
        {empty && emptyText && (
          <p className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
            <span className="bg-surface-inset px-2">{emptyText}</span>
          </p>
        )}
      </div>
      {axis && days && days.length > 1 && (
        <div
          className="mt-1.5 flex justify-between text-[10px] leading-none text-muted-foreground"
          style={{ paddingLeft: `${(left / width) * 100}%` }}
        >
          <span>{dateLabel(days[0])}</span>
          <span>{dateLabel(days[days.length - 1])}</span>
        </div>
      )}
    </div>
  );
}

/** Legend entry in tuffui's pill form: a rounded swatch, then a name or a figure. */
export function LegendPill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-foreground/[0.06] px-2.5 text-xs">
      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} aria-hidden />
      {children}
    </span>
  );
}
