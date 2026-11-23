import { ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { PromptCard, shell } from "@/components/prompt-card";
import { HomeShell } from "@/components/site-provider";
import { count, PHASES, purposeTitle, type PromptSummary } from "@/lib/prompts";
import { contributingUrl } from "@/lib/shared";

interface GalleryProps {
  prompts: PromptSummary[];
  /** Narrow to one phase (and optionally one of its purposes). Omit for the whole library. */
  phase?: string;
  purpose?: string;
}

const pillBase =
  "filter-pill press relative z-10 inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium";

/** A filter. A real link to the filtered page; scripts/gallery.ts upgrades it to an in-place filter. */
function Pill({
  href,
  filterKey,
  active,
  label,
  n,
}: {
  href?: string;
  /** The gallery state this pill selects: "", "<phase>" or "<phase>/<purpose>". */
  filterKey?: string;
  active?: boolean;
  label: string;
  n: number;
}) {
  const body = (
    <>
      {label}
      <span className="font-mono text-xs tabular-nums opacity-60">{n > 0 ? n : "Soon"}</span>
    </>
  );
  if (!href)
    return (
      <span className={`${pillBase} bg-surface text-muted-foreground opacity-50`}>{body}</span>
    );
  return (
    <a
      href={href}
      data-filter-key={filterKey}
      aria-current={active ? "page" : undefined}
      className={`${pillBase} bg-surface text-foreground/80 hover:bg-surface-raised hover:text-foreground`}
    >
      {body}
    </a>
  );
}

/**
 * Stacked alternatives that morph into each other. Every variant sits in the same
 * spot; the active one is in flow and visible, the rest wait invisibly. When the
 * state changes, scripts/gallery.ts animates the slot's width (axis "x") or height
 * (axis "y") from the old variant's size to the new one's while the two cross-fade.
 */
interface Variant {
  key: string;
  node: ReactNode;
  className?: string;
}
function Morph({
  slot,
  axis,
  active,
  variants,
  className,
}: {
  slot: string;
  axis: "x" | "y";
  active?: string | null;
  variants: Variant[];
  className?: string;
}) {
  return (
    <span data-morph={axis} data-slot={slot} className={className}>
      {variants.map((v) => (
        <span
          key={v.key}
          data-variant={v.key}
          data-active={v.key === active ? "" : undefined}
          className={v.className}
        >
          {v.node}
        </span>
      ))}
    </span>
  );
}

/** A row of pills with one sliding highlight behind the active one (positioned by scripts/gallery.ts). */
function FilterNav({
  label,
  level,
  children,
  ...rest
}: {
  label: string;
  level: "phase" | "purpose";
  children: ReactNode;
  "data-purposes-for"?: string;
}) {
  return (
    <nav
      aria-label={label}
      data-filter-nav={level}
      className="filter-nav relative flex flex-wrap gap-2"
      {...rest}
    >
      <span aria-hidden className="filter-indicator" />
      {children}
    </nav>
  );
}

const hrefFor = (key: string) => (key ? `/prompts/${key}` : "/prompts");

/** Title, blurb and result count for one filter state. */
function describe(prompts: PromptSummary[], phase?: string, purpose?: string) {
  const phaseInfo = PHASES.find((p) => p.slug === phase);
  const inPhase = phase ? prompts.filter((p) => p.phase === phase) : prompts;
  const shown = purpose ? inPhase.filter((p) => p.purpose === purpose) : inPhase;
  const title = purpose
    ? purposeTitle(purpose)
    : phaseInfo
      ? `${phaseInfo.title} prompts`
      : "All prompts";
  const blurb = purpose
    ? `${purposeTitle(purpose)} prompts for ${phaseInfo?.kicker.toLowerCase() ?? phase} projects.`
    : (phaseInfo?.blurb ??
      "Every prompt in the library. Each runs exactly once, at one specific moment in a project’s life.");
  return { title, blurb, n: shown.length };
}

const crumbClass = "crumb inline-flex items-center gap-1.5 ps-1.5";

/**
 * Browse pages (/prompts, /prompts/<phase>, /prompts/<phase>/<purpose>): a gallery of
 * prompt cards in the home layout. Each URL is still its own static page, rendered already
 * filtered, but every card is in the HTML: scripts/gallery.ts filters in place, morphs the
 * title, breadcrumb and tabs, and keeps the address bar in sync, so the filters never reload the page.
 */
export function Gallery({ prompts, phase, purpose }: GalleryProps) {
  const phases = PHASES.map((ph) => ({
    ...ph,
    n: prompts.filter((p) => p.phase === ph.slug).length,
    purposes: [...new Set(prompts.filter((p) => p.phase === ph.slug).map((p) => p.purpose))].sort(),
  }));
  const live = phases.filter((ph) => ph.n > 0);
  const current = [phase, purpose].filter(Boolean).join("/");
  const states = [
    { key: "", phase: undefined, purpose: undefined },
    ...live.flatMap((ph) => [
      { key: ph.slug, phase: ph.slug, purpose: undefined },
      ...ph.purposes.map((pu) => ({ key: `${ph.slug}/${pu}`, phase: ph.slug, purpose: pu })),
    ]),
  ];
  const described = states.map((s) => ({ ...s, ...describe(prompts, s.phase, s.purpose) }));
  const visible = (p: PromptSummary) =>
    (!phase || p.phase === phase) && (!purpose || p.purpose === purpose);
  const activePhase = live.find((ph) => ph.slug === phase);
  const depth = purpose ? 2 : phase ? 1 : 0;

  return (
    <HomeShell pathname={hrefFor(current)}>
      <main
        data-gallery
        data-current={current}
        className="mx-auto w-full max-w-[90rem] flex-1 px-4 pb-16 sm:px-6"
      >
        <header data-reveal className="pt-10 sm:pt-14">
          {/* The trail grows and shrinks one crumb at a time; at the top level it folds away. */}
          <Morph
            slot="crumbs"
            axis="y"
            active={depth > 0 ? "on" : null}
            variants={[
              {
                key: "on",
                node: (
                  <nav
                    aria-label="Breadcrumb"
                    data-depth={depth}
                    className="mb-5 flex items-center whitespace-nowrap text-sm font-medium"
                  >
                    <a
                      href="/prompts"
                      data-filter-key=""
                      className="crumb-link text-muted-foreground hover:text-foreground"
                    >
                      Library
                    </a>
                    <Morph
                      slot="crumb-phase"
                      axis="x"
                      active={phase}
                      className="shrink-0"
                      variants={live.map((ph) => ({
                        key: ph.slug,
                        node: (
                          <>
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                            <a
                              href={hrefFor(ph.slug)}
                              data-filter-key={ph.slug}
                              className="crumb-link"
                              aria-current={depth === 1 && phase === ph.slug ? "page" : undefined}
                            >
                              {ph.title}
                            </a>
                          </>
                        ),
                        className: crumbClass,
                      }))}
                    />
                    <Morph
                      slot="crumb-purpose"
                      axis="x"
                      active={purpose ? current : null}
                      className="shrink-0"
                      variants={states
                        .filter((s) => s.purpose)
                        .map((s) => ({
                          key: s.key,
                          node: (
                            <>
                              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                              <a
                                href={hrefFor(s.key)}
                                data-filter-key={s.key}
                                className="crumb-link"
                                aria-current={s.key === current ? "page" : undefined}
                              >
                                {purposeTitle(s.purpose!)}
                              </a>
                            </>
                          ),
                          className: crumbClass,
                        }))}
                    />
                  </nav>
                ),
              },
            ]}
          />
          <div className="max-w-2xl">
            <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              <Morph
                slot="title"
                axis="x"
                active={current}
                className="-mx-1 shrink-0"
                variants={described.map((d) => ({
                  key: d.key,
                  node: d.title,
                  className: "block px-1 pb-1",
                }))}
              />
              <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-brand/15 px-3 text-sm font-medium text-brand">
                <Morph
                  slot="count"
                  axis="x"
                  active={current}
                  variants={described.map((d) => ({ key: d.key, node: d.n, className: "block" }))}
                />
              </span>
            </h1>
            <Morph
              slot="blurb"
              axis="y"
              active={current}
              className="mt-3 text-lg text-muted-foreground"
              variants={described.map((d) => ({
                key: d.key,
                node: d.blurb,
                className: "text-pretty",
              }))}
            />
          </div>
        </header>

        <div data-reveal className="mt-8 flex flex-col">
          <FilterNav label="Phase" level="phase">
            <Pill href="/prompts" filterKey="" active={!phase} label="All" n={prompts.length} />
            {phases.map((ph) => (
              <Pill
                key={ph.slug}
                href={ph.n > 0 ? hrefFor(ph.slug) : undefined}
                filterKey={ph.slug}
                active={phase === ph.slug}
                label={ph.title}
                n={ph.n}
              />
            ))}
          </FilterNav>
          {/* The purpose row morphs in under its phase, swaps when the phase changes and folds away for "All". */}
          <Morph
            slot="purposes"
            axis="y"
            active={activePhase?.slug ?? null}
            className="-mx-1"
            variants={live.map((ph) => ({
              key: ph.slug,
              className: "px-1 pb-1 pt-3",
              node: (
                <FilterNav label="Purpose" level="purpose" data-purposes-for={ph.slug}>
                  <Pill
                    href={hrefFor(ph.slug)}
                    filterKey={ph.slug}
                    active={phase === ph.slug && !purpose}
                    label="Any purpose"
                    n={ph.n}
                  />
                  {ph.purposes.map((pu) => (
                    <Pill
                      key={pu}
                      href={hrefFor(`${ph.slug}/${pu}`)}
                      filterKey={`${ph.slug}/${pu}`}
                      active={phase === ph.slug && purpose === pu}
                      label={purposeTitle(pu)}
                      n={prompts.filter((p) => p.phase === ph.slug && p.purpose === pu).length}
                    />
                  ))}
                </FilterNav>
              ),
            }))}
          />
        </div>
        <p className="sr-only" role="status" aria-live="polite" data-gallery-status />

        <section className="mt-10" aria-label="Prompts">
          <div
            data-gallery-grid
            className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {prompts.map((p) => (
              <PromptCard key={p.splat} prompt={p} hidden={!visible(p)} />
            ))}
            <a
              href={contributingUrl}
              target="_blank"
              rel="noreferrer"
              data-reveal
              data-gallery-item
              className={`press lift group flex min-h-48 flex-col ${shell} hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]`}
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-fd-border px-6 py-8 text-center">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-foreground/[0.06]">
                  <Plus className="size-5 transition-transform duration-300 ease-[var(--ease-arrive)] group-hover:rotate-90" />
                </span>
                <div>
                  <p className="font-medium">Contribute yours</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Got a prompt that should run exactly once? Add it to the library.
                  </p>
                </div>
              </div>
            </a>
          </div>
        </section>
      </main>
    </HomeShell>
  );
}
