import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  X,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { PromptCard, shell } from "@/components/prompt-card";
import { hue } from "@/components/prompt-tags";
import { HomeShell } from "@/components/site-provider";
import { PHASES, purposeTitle, type PromptSummary } from "@/lib/prompts";
import { browseMeta, documentTitle } from "@/lib/seo";
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

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "updated", label: "Recently updated" },
  { value: "copies", label: "Most copied" },
  { value: "views", label: "Most viewed" },
  { value: "title", label: "Title A–Z" },
] as const;

/** Enough tags to cover the common facets without turning the row into a tag cloud. */
const INITIAL_TAG_COUNT = 12;

/** JSON inside a script tag must not be able to close that tag. */
const serializeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

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
  const visibleCount = prompts.filter(visible).length;
  const activePhase = live.find((ph) => ph.slug === phase);
  const depth = purpose ? 2 : phase ? 1 : 0;

  const tagCounts = new Map<string, number>();
  for (const prompt of prompts) {
    for (const tag of prompt.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const tags = [...tagCounts]
    .map(([tag, n]) => ({ tag, n }))
    .sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
  const extraTags = Math.max(0, tags.length - INITIAL_TAG_COUNT);

  // Match the client's default "recommended" order so enhancement does not reshuffle
  // the first paint: proven prompts first, then fresh ones, then title.
  const updatedTime = (p: PromptSummary) => {
    const time = p.updated ? Date.parse(p.updated) : 0;
    return Number.isFinite(time) ? time : 0;
  };
  const popularity = (p: PromptSummary) =>
    (p.stats?.totalCopies ?? 0) * 5 + (p.stats?.totalViews ?? 0);
  const titleCollator = new Intl.Collator("en", { sensitivity: "base" });
  const recommendedPrompts = [...prompts].sort(
    (a, b) =>
      popularity(b) - popularity(a) ||
      updatedTime(b) - updatedTime(a) ||
      titleCollator.compare(a.title, b.title),
  );

  // Structured metadata for scripts/gallery.ts. Keeping it in one JSON block avoids
  // duplicating searchable text across data attributes on every card.
  const galleryIndex = recommendedPrompts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    phase: p.phase,
    purpose: p.purpose,
    tags: p.tags,
    preview: p.preview,
    author: p.author,
    updated: p.updated,
    views: p.stats?.totalViews ?? 0,
    copies: p.stats?.totalCopies ?? 0,
  }));

  return (
    <HomeShell pathname={hrefFor(current)}>
      <main
        data-gallery
        data-current={current}
        data-titles={JSON.stringify(
          Object.fromEntries(
            states.map((s) => [s.key, documentTitle(browseMeta(s.phase, s.purpose).title)]),
          ),
        )}
        className="mx-auto w-full max-w-[90rem] flex-1 px-4 pb-16 sm:px-6"
      >
        <script
          type="application/json"
          data-gallery-index
          dangerouslySetInnerHTML={{ __html: serializeJson(galleryIndex) }}
        />
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

        {/* Search, tags and sort are enhancements of the static catalog. The inline
            theme script marks html with data-js before paint, so these controls never
            appear in a no-JavaScript browsing experience where they cannot work. */}
        <section data-gallery-controls aria-label="Search and refine prompts" className="mt-8">
          <div className={shell}>
            <div className="rounded-2xl bg-surface-inset p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    data-gallery-search
                    type="search"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Search prompts, tags, authors, or keywords…"
                    aria-label="Search prompts"
                    className="h-11 w-full rounded-full bg-surface pe-11 ps-11 text-sm text-foreground placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="button"
                    data-gallery-clear-search
                    aria-label="Clear search"
                    hidden
                    className="press absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <label className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-surface px-4 text-sm text-muted-foreground">
                  <ArrowUpDown className="size-4" />
                  <span>Sort</span>
                  <span className="relative flex items-center">
                    <select
                      data-gallery-sort
                      aria-label="Sort prompts"
                      className="cursor-pointer appearance-none bg-transparent pe-5 font-medium text-foreground"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 size-3.5" />
                  </span>
                </label>
              </div>

              <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                <span className="pe-1 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Tags
                </span>
                <span className="shrink-0 text-xs text-muted-foreground/70">any match</span>
                {tags.map(({ tag, n }, i) => {
                  const extra = i >= INITIAL_TAG_COUNT;
                  return (
                    <button
                      key={tag}
                      type="button"
                      data-tag-filter={tag}
                      data-tag-extra={extra ? "" : undefined}
                      aria-pressed="false"
                      hidden={extra}
                      className="tag tag-filter press"
                      style={{ "--h": hue(tag) } as CSSProperties}
                    >
                      <span>#{tag}</span>
                      <span
                        data-tag-count
                        className="font-mono text-[0.6875rem] tabular-nums opacity-60"
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
                {extraTags > 0 && (
                  <button
                    type="button"
                    data-tags-toggle
                    aria-expanded="false"
                    className="press inline-flex h-6 items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span data-tags-toggle-label>{extraTags} more</span>
                    <ChevronDown data-tags-chevron className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p data-gallery-summary className="text-sm text-muted-foreground">
                  {visibleCount === prompts.length
                    ? `${visibleCount} prompt${visibleCount === 1 ? "" : "s"}`
                    : `Showing ${visibleCount} of ${prompts.length} prompts`}
                </p>
                <button
                  type="button"
                  data-gallery-reset
                  hidden
                  className="press inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-medium text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Reset filters
                </button>
              </div>
            </div>
          </div>
        </section>

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
            data-gallery-empty
            hidden
            className="mb-4 flex flex-col items-center rounded-[1.375rem] bg-surface px-6 py-10 text-center"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground">
              <SearchX className="size-5" />
            </span>
            <p className="mt-4 font-medium">No prompts match those filters</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Try a broader search, remove a tag, or browse a different phase or purpose.
            </p>
            <button
              type="button"
              data-gallery-reset-advanced
              className="press mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
            >
              <RotateCcw className="size-4" />
              Clear search and tags
            </button>
          </div>
          <div
            data-gallery-grid
            className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {recommendedPrompts.map((p) => (
              <PromptCard key={p.splat} prompt={p} hidden={!visible(p)} />
            ))}
            <a
              href={contributingUrl}
              target="_blank"
              rel="noreferrer"
              data-reveal
              data-gallery-item
              data-contribute
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
