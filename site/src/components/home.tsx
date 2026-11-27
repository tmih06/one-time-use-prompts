import { ArrowRight, Plus } from "lucide-react";
import { HeroAnalytics } from "@/components/analytics-panels";
import { GalleryControls, GalleryEmptyState } from "@/components/gallery-controls";
import { PromptCard, shell } from "@/components/prompt-card";
import { HomeShell } from "@/components/site-provider";
import { analytics } from "@/lib/analytics";
import { recommendedOrder } from "@/lib/gallery-utils";
import { count, PHASES, type PromptSummary } from "@/lib/prompts";
import { contributingUrl } from "@/lib/shared";

const pill =
  "press group inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium";

export function Home({ prompts }: { prompts: PromptSummary[] }) {
  const orderedPrompts = recommendedOrder(prompts);

  return (
    <HomeShell pathname="/">
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 sm:px-6">
        <section className="pt-4">
          <div className={shell}>
            <div className="relative flex flex-col items-center rounded-2xl bg-surface-inset px-4 py-20 text-center sm:px-6 sm:py-28">
              <span
                data-reveal
                className="mb-6 inline-flex h-8 items-center gap-2 rounded-full bg-foreground/[0.06] ps-1 pe-3 text-[0.8125rem] text-muted-foreground"
              >
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                  {prompts.length}
                </span>
                {prompts.length === 1 ? "prompt" : "prompts"} in the library
              </span>
              <h1
                data-reveal
                className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                Prompts that run exactly once.
              </h1>
              <p data-reveal className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
                Focused instructions for one specific moment in a project’s life — at creation, or
                on an existing codebase. Copy one, run it, move on. No accounts, no paywall.
              </p>
              <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/prompts"
                  className={`${pill} bg-foreground text-background hover:opacity-90`}
                >
                  Browse prompts
                  <ArrowRight className="size-4 transition-transform duration-300 ease-[var(--ease-arrive)] group-hover:translate-x-0.5" />
                </a>
                <a
                  href={contributingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${pill} bg-surface-raised hover:bg-[color-mix(in_oklab,var(--surface-raised),var(--foreground)_7%)]`}
                >
                  <Plus className="size-4 transition-transform duration-300 ease-[var(--ease-arrive)] group-hover:rotate-90" />
                  Contribute yours
                </a>
              </div>
              {analytics && <HeroAnalytics snapshot={analytics} prompts={prompts} />}
            </div>
          </div>
        </section>

        <section data-gallery data-gallery-base="/" className="py-16" aria-labelledby="all-prompts">
          <div data-reveal className="mb-8 flex items-end justify-between gap-4">
            <h2 id="all-prompts" className="text-2xl font-semibold tracking-tight">
              All prompts
            </h2>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {count(prompts.length)}
            </span>
          </div>
          <GalleryControls prompts={prompts} visibleCount={prompts.length} className="mt-0" />
          {/* Phases live here as filters, not a section of their own. A phase with no prompts has no page yet. */}
          <nav data-reveal aria-label="Browse by phase" className="mt-8 mb-8 flex flex-wrap gap-2">
            {PHASES.map((phase) => {
              const n = prompts.filter((p) => p.phase === phase.slug).length;
              const body = (
                <>
                  {phase.title}
                  <span className="font-mono text-xs tabular-nums opacity-60">
                    {n > 0 ? n : "Soon"}
                  </span>
                </>
              );
              const base =
                "press inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium bg-surface";
              return n > 0 ? (
                <a
                  key={phase.slug}
                  href={`/prompts/${phase.slug}`}
                  data-gallery-phase-link={phase.slug}
                  title={phase.blurb}
                  className={`${base} text-foreground/80 hover:bg-surface-raised hover:text-foreground`}
                >
                  {body}
                </a>
              ) : (
                <span key={phase.slug} className={`${base} text-muted-foreground opacity-50`}>
                  {body}
                </span>
              );
            })}
          </nav>
          <p className="sr-only" role="status" aria-live="polite" data-gallery-status />
          <GalleryEmptyState />
          <div
            data-gallery-grid
            className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {orderedPrompts.map((p) => (
              <PromptCard key={p.splat} prompt={p} />
            ))}
          </div>
        </section>
      </main>
    </HomeShell>
  );
}
