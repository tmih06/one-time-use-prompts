"use client";
import { usePathname } from "fumadocs-core/framework";
import { ExternalLink, FileText } from "lucide-react";
import type { ReactNode } from "react";

interface PromptActionsProps {
  markdownUrl: string;
  githubUrl: string;
}

interface ActionLink {
  title: string;
  href: string;
  icon?: ReactNode;
}

const withBasePath = (href: string): string =>
  (import.meta.env?.BASE_URL ?? "").replace(/\/$/, "") + href;

/**
 * Replaces the docs "On this page" ToC column on prompt pages: the raw links
 * that normally hide behind the "Open" popover are listed one by one so each
 * destination is a single click. Renders as the grid's `toc` column.
 */
export function PromptActions({ markdownUrl, githubUrl }: PromptActionsProps) {
  const pathname = usePathname();
  const pageUrl = typeof window === "undefined" ? pathname : window.location.href;
  const q = `Read ${pageUrl}, I want to ask questions about it.`;

  const links: ActionLink[] = [
    {
      title: "View as Markdown",
      href: withBasePath(markdownUrl),
      icon: <FileText />,
    },
    {
      title: "Open in GitHub",
      href: githubUrl,
      icon: <ExternalLink />,
    },
    {
      title: "Open in Scira AI",
      href: `https://scira.ai/?${new URLSearchParams({ q })}`,
    },
    {
      title: "Open in ChatGPT",
      href: `https://chatgpt.com/?${new URLSearchParams({ prompt: q, hints: "search" })}`,
    },
    {
      title: "Open in Claude",
      href: `https://claude.ai/new?${new URLSearchParams({ q })}`,
    },
    {
      title: "Open in Cursor",
      href: `https://cursor.com/link/prompt?${new URLSearchParams({ text: q })}`,
    },
  ];

  return (
    <div className="sticky top-(--fd-docs-row-1) flex flex-col gap-1 [grid-area:toc] w-(--fd-toc-width) pt-12 pe-4 pb-2 xl:layout:[--fd-toc-width:268px] max-xl:hidden">
      <h3 className="mb-1 inline-flex items-center gap-1.5 px-2 text-sm text-fd-muted-foreground">
        <ExternalLink className="size-4" />
        Open prompt in
      </h3>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg p-2 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4"
        >
          {link.icon}
          {link.title}
        </a>
      ))}
    </div>
  );
}
