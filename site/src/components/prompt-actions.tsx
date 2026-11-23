import { usePathname } from "fumadocs-core/framework";
import { ArrowUpRight, FileText, GitBranch, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { Tweet } from "react-tweet/api";
import { TweetSourceCard } from "@/components/tweet-card";

interface PromptActionsProps {
  markdownUrl: string;
  githubUrl: string;
  /** Tweets cited as the prompt's source; the first is shown under the links. */
  tweets?: Tweet[];
}

interface ActionLink {
  title: string;
  href: string;
  icon: ReactNode;
  /** Query param holding the question; scripts/site.ts fills in the absolute page URL. */
  ask?: string;
}

interface ActionGroup {
  label: string;
  links: ActionLink[];
}

const withBasePath = (href: string): string =>
  (import.meta.env?.BASE_URL ?? "").replace(/\/$/, "") + href;

/**
/**
 * Right-hand column of a prompt page: where the prompt can be opened, grouped
 * into source links and AI assistants as a plain list, followed by the
 * prompt's source tweet when it has one. Renders as the docs grid's `toc`
 * column, level with the breadcrumb; the stack sticks while the prompt scrolls.
 */
export function PromptActions({ markdownUrl, githubUrl, tweets = [] }: PromptActionsProps) {
  const pathname = usePathname();
  const q = `Read ${pathname}, I want to ask questions about it.`;

  const ai = (
    title: string,
    base: string,
    ask: string,
    params: Record<string, string>,
  ): ActionLink => ({
    title,
    ask,
    href: `${base}?${new URLSearchParams(params)}`,
    icon: <Sparkles />,
  });

  const groups: ActionGroup[] = [
    {
      label: "Open",
      links: [
        { title: "View as Markdown", href: withBasePath(markdownUrl), icon: <FileText /> },
        { title: "Open in GitHub", href: githubUrl, icon: <GitBranch /> },
      ],
    },
    {
      label: "Run in",
      links: [
        ai("Claude", "https://claude.ai/new", "q", { q }),
        ai("ChatGPT", "https://chatgpt.com/", "prompt", { prompt: q, hints: "search" }),
        ai("Scira", "https://scira.ai/", "q", { q }),
        ai("Cursor", "https://cursor.com/link/prompt", "text", { text: q }),
      ],
    },
  ];

  return (
    <aside
      aria-label="Open this prompt"
      className="[grid-area:toc] self-stretch w-(--fd-toc-width) pe-4 pt-14 pb-8 xl:layout:[--fd-toc-width:268px] max-xl:hidden"
    >
      <div className="sticky top-14 flex flex-col gap-6">
        <nav className="flex flex-col gap-5 text-sm">
          {groups.map((group) => (
            <section key={group.label}>
              <h3 className="mb-1.5 px-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      data-ask={link.ask}
                      target="_blank"
                      rel="noreferrer"
                      className="press group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-foreground/85 hover:bg-foreground/[0.06] hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
                    >
                      <span className="text-muted-foreground group-hover:text-foreground">
                        {link.icon}
                      </span>
                      <span className="flex-1 truncate">{link.title}</span>
                      <ArrowUpRight className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
        {tweets[0] && <TweetSourceCard tweet={tweets[0]} />}
      </div>
    </aside>
  );
}
