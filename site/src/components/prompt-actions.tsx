import { usePathname } from "fumadocs-core/framework";
import { ArrowUpRight, FileText, GitBranch, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface PromptActionsProps {
  markdownUrl: string;
  githubUrl: string;
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
 * Right-hand column of a prompt page: where the prompt can be opened, grouped
 * into source links and AI assistants. A `surface` shell wrapping a darker
 * inset well (Tuff's borderless layering). Renders as the docs grid's `toc`
 * column, pinned at the height where the prompt block starts.
 */
export function PromptActions({ markdownUrl, githubUrl }: PromptActionsProps) {
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
      label: "Source",
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
      className="[grid-area:toc] self-stretch w-(--fd-toc-width) pe-4 pt-[19rem] pb-8 xl:layout:[--fd-toc-width:268px] max-xl:hidden"
    >
      <nav className="sticky top-[19rem] rounded-[1.375rem] bg-surface p-1.5 text-sm">
        <div className="flex flex-col gap-3 rounded-2xl bg-surface-inset p-1.5">
          {groups.map((group) => (
            <section key={group.label}>
              <h3 className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </h3>
              <ul className="flex flex-col">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      data-ask={link.ask}
                      target="_blank"
                      rel="noreferrer"
                      className="press group flex h-9 items-center gap-2.5 rounded-full px-3 text-foreground/90 hover:bg-foreground/[0.06] hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
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
        </div>
      </nav>
    </aside>
  );
}
