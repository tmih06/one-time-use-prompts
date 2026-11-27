import { ArrowUpDown, Check, ChevronDown, Plus, RotateCcw, Search, SearchX, X } from "lucide-react";
import type { CSSProperties } from "react";
import { shell } from "@/components/prompt-card";
import { hue } from "@/components/prompt-tags";
import {
  galleryIndex,
  INITIAL_TAG_COUNT,
  serializeJson,
  SORT_OPTIONS,
  tagFacets,
} from "@/lib/gallery-utils";
import type { PromptSummary } from "@/lib/prompts";
import { contributingUrl } from "@/lib/shared";

/**
 * Search, tag and sort controls shared by the homepage and the browse pages.
 * They are rendered once per page, while scripts/gallery.ts supplies all behavior.
 */
export function GalleryControls({
  prompts,
  visibleCount,
  className = "mt-8",
}: {
  prompts: PromptSummary[];
  visibleCount: number;
  className?: string;
}) {
  const tags = tagFacets(prompts);
  const extraTags = Math.max(0, tags.length - INITIAL_TAG_COUNT);

  return (
    <>
      <script
        type="application/json"
        data-gallery-index
        dangerouslySetInnerHTML={{ __html: serializeJson(galleryIndex(prompts)) }}
      />
      {/* These controls are enhancements of the static catalog. The inline theme
          script marks html with data-js before paint, so they never appear in a
          no-JavaScript browsing experience where they cannot work. */}
      <section data-gallery-controls aria-label="Search and refine prompts" className={className}>
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

              <div className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-surface px-3 text-sm text-muted-foreground">
                <ArrowUpDown className="ms-1 size-4" />
                <span>Sort</span>
                <div data-gallery-sort className="relative ms-auto flex items-center">
                  <button
                    type="button"
                    data-gallery-sort-button
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="gallery-sort-menu"
                    className="press inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 font-medium text-foreground hover:bg-surface-raised"
                  >
                    <span data-gallery-sort-label>{SORT_OPTIONS[0].label}</span>
                    <ChevronDown
                      data-gallery-sort-chevron
                      className="size-3.5 text-muted-foreground"
                    />
                  </button>
                  <div
                    id="gallery-sort-menu"
                    data-gallery-sort-menu
                    role="listbox"
                    aria-label="Sort prompts"
                    hidden
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-2xl bg-surface-raised p-1.5 shadow-xl shadow-black/20 ring-1 ring-foreground/5"
                  >
                    {SORT_OPTIONS.map((option) => {
                      const selected = option.value === SORT_OPTIONS[0].value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          tabIndex={-1}
                          data-sort-value={option.value}
                          aria-selected={selected}
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                        >
                          <span data-sort-label>{option.label}</span>
                          <span data-sort-check hidden={!selected} className="inline-flex shrink-0">
                            <Check className="size-4 text-brand" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
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
    </>
  );
}

/** Shared no-results state for every prompt gallery. */
export function GalleryEmptyState() {
  return (
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
  );
}

/** Shared invitation card placed after the real prompt cards. */
export function GalleryContributeCard() {
  return (
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
  );
}
