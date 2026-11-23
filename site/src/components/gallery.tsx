import { Plus } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
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

const pillBase = "press inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium";

function Pill({
  href,
  active,
  label,
  n,
}: {
  href?: string;
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
      aria-current={active ? "page" : undefined}
      className={`${pillBase} ${
        active
          ? "bg-foreground text-background"
          : "bg-surface text-foreground/80 hover:bg-surface-raised hover:text-foreground"
      }`}
    >
      {body}
    </a>
  );
}

/**
 * Browse pages (/docs, /docs/<phase>, /docs/<phase>/<purpose>): a gallery of
 * prompt cards with link-based filters, in the home layout. Every filter is a real static page — no client JS.
 */
export function Gallery({ prompts, phase, purpose }: GalleryProps) {
  const phaseInfo = PHASES.find((p) => p.slug === phase);
  const inPhase = phase ? prompts.filter((p) => p.phase === phase) : prompts;
  const shown = purpose ? inPhase.filter((p) => p.purpose === purpose) : inPhase;
  const purposes = [...new Set(inPhase.map((p) => p.purpose))].sort();

  const title = purpose
    ? purposeTitle(purpose)
    : phaseInfo
      ? `${phaseInfo.title} prompts`
      : "All prompts";
  const blurb = purpose
    ? `${purposeTitle(purpose)} prompts for ${phaseInfo?.kicker.toLowerCase() ?? phase} projects.`
    : (phaseInfo?.blurb ??
      "Every prompt in the library. Each runs exactly once, at one specific moment in a project’s life.");
  const crumbs = [
    { label: "Library", href: "/docs" },
    ...(phaseInfo ? [{ label: phaseInfo.title, href: `/docs/${phaseInfo.slug}` }] : []),
    ...(purpose ? [{ label: purposeTitle(purpose), href: `/docs/${phase}/${purpose}` }] : []),
  ];
  const pathname =
    crumbs[crumbs.length - 1].href === "/docs" ? "/docs" : crumbs[crumbs.length - 1].href;

  return (
    <HomeShell pathname={pathname}>
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 pb-16 sm:px-6">
        <header className="pt-10 sm:pt-14">
          <Breadcrumb crumbs={crumbs} />
          <div>
            <div className="max-w-2xl">
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                {title}
                <span
                  className="ms-3 inline-flex h-7 -translate-y-1.5 items-center rounded-full bg-brand/15 px-3 align-middle text-sm font-medium text-brand"
                  aria-label={count(shown.length)}
                >
                  {shown.length}
                </span>
              </h1>
              <p className="mt-3 text-pretty text-lg text-muted-foreground">{blurb}</p>
            </div>
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <nav aria-label="Phase" className="flex flex-wrap gap-2">
              <Pill href="/docs" active={!phase} label="All" n={prompts.length} />
              {PHASES.map((ph) => {
                const n = prompts.filter((p) => p.phase === ph.slug).length;
                return (
                  <Pill
                    key={ph.slug}
                    href={n > 0 ? `/docs/${ph.slug}` : undefined}
                    active={phase === ph.slug}
                    label={ph.title}
                    n={n}
                  />
                );
              })}
            </nav>
            {phase && purposes.length > 0 && (
              <nav aria-label="Purpose" className="flex flex-wrap gap-2">
                <Pill
                  href={`/docs/${phase}`}
                  active={!purpose}
                  label="Any purpose"
                  n={inPhase.length}
                />
                {purposes.map((pu) => (
                  <Pill
                    key={pu}
                    href={`/docs/${phase}/${pu}`}
                    active={purpose === pu}
                    label={purposeTitle(pu)}
                    n={inPhase.filter((p) => p.purpose === pu).length}
                  />
                ))}
              </nav>
            )}
          </div>
        </div>

        <section className="mt-10" aria-label="Prompts">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <PromptCard key={p.splat} prompt={p} />
            ))}
            <a
              href={contributingUrl}
              target="_blank"
              rel="noreferrer"
              className={`press group flex min-h-48 flex-col ${shell} hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]`}
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-fd-border px-6 py-8 text-center">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-foreground/[0.06]">
                  <Plus className="size-5" />
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
