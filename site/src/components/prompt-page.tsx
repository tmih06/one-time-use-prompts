import { DocsBody } from "fumadocs-ui/layouts/docs/page";
import type { Tweet } from "react-tweet/api";
import { Breadcrumb } from "@/components/breadcrumb";
import { getMDXComponents } from "@/components/mdx";
import { PromptUsage } from "@/components/analytics-panels";
import { PromptActions } from "@/components/prompt-actions";
import { PromptCard } from "@/components/prompt-card";
import { PromptTags } from "@/components/prompt-tags";
import { HomeShell } from "@/components/site-provider";
import { TweetSourceCard } from "@/components/tweet-card";
import { analytics } from "@/lib/analytics";
import { PHASES, purposeTitle, type PromptSummary } from "@/lib/prompts";
import { getSourceUrl } from "@/lib/shared";
import { docs } from "@/lib/source";
import { tweetIdFromUrl } from "@/lib/tweet";

interface PromptPageProps {
  path: string;
  pathname: string;
  markdownUrl: string;
  tweets?: Tweet[];
  /** Other prompts to suggest under this one. */
  related?: PromptSummary[];
}

/**
 * A single prompt: title and tags, the prompt itself front and centre, and a
 * sticky column with where to open it and the post it came from. Uses the
 * same sidebar-free shell as the home page and the gallery.
 */
export function PromptPage({
  path,
  pathname,
  markdownUrl,
  tweets = [],
  related = [],
}: PromptPageProps) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`unknown page: ${path}`);
  const MDX = page.body;
  const tweet = tweets[0];

  // A source that rendered as a card doesn't need a link chip too; chips stay
  // for everything else, and for tweets that failed to fetch.
  const sourceChips = (page.source ?? []).filter((url) => {
    const id = tweetIdFromUrl(url);
    return !id || id !== tweet?.id_str;
  });

  const phase = PHASES.find((p) => p.slug === page.phase);
  const crumbs = [
    { label: "Library", href: "/prompts" },
    ...(phase ? [{ label: phase.title, href: `/prompts/${phase.slug}` }] : []),
    ...(page.phase && page.purpose
      ? [{ label: purposeTitle(page.purpose), href: `/prompts/${page.phase}/${page.purpose}` }]
      : []),
    { label: page.title, href: pathname },
  ];

  return (
    <HomeShell pathname={pathname}>
      <main
        data-prompt-id={pathname.split("/").pop()}
        data-phase={page.phase}
        data-purpose={page.purpose}
        className="mx-auto w-full max-w-[90rem] flex-1 px-4 pb-16 sm:px-6"
      >
        <div className="grid gap-x-10 gap-y-8 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <header data-reveal>
              <Breadcrumb crumbs={crumbs} />
              <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {page.title}
              </h1>
              <p className="mt-4 max-w-3xl text-pretty text-lg text-muted-foreground">
                {page.description}
              </p>
              <PromptTags
                className="mt-5"
                phase={page.phase}
                purpose={page.purpose}
                tags={page.tags}
                author={page.author}
                source={sourceChips}
              />
            </header>
            <DocsBody data-reveal className="mt-8">
              <MDX components={getMDXComponents()} />
            </DocsBody>
          </div>
          <aside data-reveal className="lg:self-stretch">
            {/* Sticks only when the whole column fits on screen; otherwise it scrolls with the page, never inside itself. */}
            <div className="flex flex-col gap-6 lg:[@media(min-height:1020px)]:sticky lg:[@media(min-height:1020px)]:top-20">
              <PromptActions markdownUrl={markdownUrl} githubUrl={getSourceUrl(path)} />
              {tweet && <TweetSourceCard tweet={tweet} />}
              {analytics && <PromptUsage snapshot={analytics} id={pathname.split("/").pop()!} />}
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="more-prompts">
            <h2
              id="more-prompts"
              data-reveal
              className="mb-6 text-2xl font-semibold tracking-tight"
            >
              More prompts
            </h2>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PromptCard key={p.splat} prompt={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </HomeShell>
  );
}
