import { source } from "@/lib/source";

export interface PromptSummary {
  splat: string;
  id: string;
  title: string;
  description: string;
  phase: string;
  purpose: string;
  tags: string[];
  preview: string[];
}

export const PHASES = [
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

export const count = (n: number) => `${n} prompt${n === 1 ? "" : "s"}`;

export const purposeTitle = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

// Page metadata (including the preview lines) is bundled with `source` at build time.
export function getPrompts(): PromptSummary[] {
  return source
    .getPages()
    .filter((page) => page.slugs.length === 3)
    .map((page) => ({
      splat: page.slugs.join("/"),
      id: page.slugs[2],
      title: page.data.title,
      description: page.data.description ?? "",
      phase: page.slugs[0],
      purpose: page.slugs[1],
      tags: page.data.tags ?? [],
      preview: page.data.preview ?? [],
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
