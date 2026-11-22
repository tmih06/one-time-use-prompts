import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { ArrowRight, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { hue } from "@/components/prompt-tags";
import { baseOptions } from "@/lib/layout.shared";
import { appName, gitConfig } from "@/lib/shared";
import { source } from "@/lib/source";

interface PromptSummary {
  url: string;
  id: string;
  title: string;
  description: string;
  phase: string;
  purpose: string;
  tags: string[];
}

const PHASES = [
  {
    slug: "creation",
    title: "Creation",
    kicker: "Greenfield",
    blurb: "Starting from scratch — set the strategy, foundation and governance of a new project.",
  },
  {
    slug: "existing",
    title: "Existing",
    kicker: "Brownfield",
    blurb: "Working on a live codebase — quality, security, docs, operations and maintenance.",
  },
] as const;

const contributingUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/CONTRIBUTING.md`;

// Page metadata is already bundled with `source`, so this runs the same on the
// server (prerender) and in the SPA shell — no static server-fn cache needed.
function getPrompts(): PromptSummary[] {
  return source
    .getPages()
    .filter((page) => page.slugs.length === 3)
    .map((page) => ({
      url: page.url,
      id: page.slugs[2],
      title: page.data.title,
      description: page.data.description ?? "",
      phase: page.slugs[0],
      purpose: page.slugs[1],
      tags: page.data.tags ?? [],
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const Route = createFileRoute("/")({
  component: Home,
  loader: () => getPrompts(),
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "A curated library of focused prompts that run exactly once — at project creation or on an existing codebase.",
      },
      { property: "og:title", content: appName },
      { property: "og:type", content: "website" },
    ],
  }),
});

/** The layered "shell around an inset well" card recipe used across the site. */
const shell = "rounded-[1.375rem] bg-surface p-1.5";
const pill = "press inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium";

function Home() {
  const prompts = Route.useLoaderData();
  const count = (n: number) => `${n} prompt${n === 1 ? "" : "s"}`;

  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 sm:px-6">
        <section className="pt-4">
          <div className={shell}>
            <div className="flex flex-col items-center rounded-2xl bg-surface-inset px-4 py-20 text-center sm:px-6 sm:py-28">
              <span className="mb-6 inline-flex h-8 items-center gap-2 rounded-full bg-foreground/[0.06] ps-1 pe-3 text-[0.8125rem] text-muted-foreground">
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                  {prompts.length}
                </span>
                {prompts.length === 1 ? "prompt" : "prompts"} in the library
              </span>
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Prompts that run exactly once.
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
                Focused instructions for one specific moment in a project’s life — at creation, or
                on an existing codebase. Copy one, run it, move on. No accounts, no paywall.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/docs/$"
                  params={{ _splat: "" }}
                  className={`${pill} bg-foreground text-background hover:opacity-90`}
                >
                  Browse prompts
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href={contributingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${pill} bg-surface-raised hover:bg-[color-mix(in_oklab,var(--surface-raised),var(--foreground)_7%)]`}
                >
                  <Plus className="size-4" />
                  Contribute yours
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-16" aria-labelledby="phases">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="phases" className="text-2xl font-semibold tracking-tight">
              Browse by phase
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PHASES.map((phase) => {
              const n = prompts.filter((p) => p.phase === phase.slug).length;
              const inner = (
                <div className="flex flex-col gap-1 px-3 pb-2.5 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{phase.title}</h3>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {n > 0 ? count(n) : "Soon"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{phase.blurb}</p>
                  <p className="mt-1.5 text-[0.8125rem] text-muted-foreground/80">{phase.kicker}</p>
                </div>
              );
              // A phase with no prompts has no docs page yet — don't link to a 404.
              return n > 0 ? (
                <Link
                  key={phase.slug}
                  to="/docs/$"
                  params={{ _splat: phase.slug }}
                  className={`press group ${shell} hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]`}
                >
                  {inner}
                </Link>
              ) : (
                <div key={phase.slug} className={`${shell} opacity-60`}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-16" aria-labelledby="all-prompts">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="all-prompts" className="text-2xl font-semibold tracking-tight">
              All prompts
            </h2>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {count(prompts.length)}
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prompts.map((p) => (
              <Link
                key={p.url}
                to="/docs/$"
                params={{ _splat: p.url.replace(/^\/docs\/?/, "") }}
                className={`press group flex min-w-0 flex-col ${shell} hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]`}
              >
                {/* inset "preview" well: the top of the prompt file, plus its tags */}
                <div className="relative flex aspect-[16/10] flex-col overflow-hidden rounded-2xl bg-surface-inset p-4 font-mono text-[11px] leading-relaxed">
                  <span className="mb-2 text-muted-foreground/70">{p.id}.md</span>
                  <span className="line-clamp-2 text-brand">{`# ${p.title}`}</span>
                  <span className="mt-2 line-clamp-3 text-muted-foreground">
                    {`> ${p.description}`}
                  </span>
                  <span className="mt-auto flex flex-wrap gap-1 pt-3 font-sans">
                    {p.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="tag !h-5 !px-2 !text-[0.6875rem]"
                        style={{ "--h": hue(t) } as CSSProperties}
                      >
                        #{t}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="flex flex-col gap-1 px-3 pb-2.5 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex min-w-0 items-center gap-2 font-medium">
                      <span className="truncate">{p.title}</span>
                    </h3>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {p.tags.length} tags
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <p className="mt-1.5 text-[0.8125rem] capitalize text-muted-foreground/80">
                    {p.phase} · {p.purpose}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </HomeLayout>
  );
}
