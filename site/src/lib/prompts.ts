import { source } from "@/lib/source";
import { analytics } from "@/lib/analytics";
import { fetchTweets } from "@/lib/tweet";

export interface PromptSummary {
  splat: string;
  id: string;
  title: string;
  description: string;
  phase: string;
  purpose: string;
  tags: string[];
  preview: string[];
  author?: string;
  /** ISO date the prompt file last changed. */
  updated?: string;
  /** Recent usage; absent until analytics has recorded something. */
  stats?: PromptStats;
}

export interface PromptStats {
  /** Daily values for the last `days` days, oldest first. */
  views: number[];
  copies: number[];
  totalViews: number;
  totalCopies: number;
  days: number;
}

/** Days of usage shown on a prompt card. */
const CARD_DAYS = 14;

function statsFor(id: string): PromptStats | undefined {
  if (!analytics) return undefined;
  const series = analytics.perPrompt[id];
  const views = (series?.views ?? analytics.days.map(() => 0)).slice(-CARD_DAYS);
  const copies = (series?.copies ?? analytics.days.map(() => 0)).slice(-CARD_DAYS);
  const total = (values: number[]) => values.reduce((a, b) => a + b, 0);
  return {
    views,
    copies,
    totalViews: total(views),
    totalCopies: total(copies),
    days: views.length,
  };
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
    blurb:
      "Working on a live codebase — quality, security, docs, operations, maintenance and polish.",
  },
] as const;

/**
 * Handles of source-tweet authors that X shows a verified tick for, looked up
 * once at build time (the tweet is already fetched for its prompt page).
 */
const verifiedHandles = new Set<string>();
await Promise.all(
  source.getPages().map(async (page) => {
    for (const { user } of await fetchTweets(page.data.source)) {
      if (user.is_blue_verified || user.verified)
        verifiedHandles.add(user.screen_name.toLowerCase());
    }
  }),
);

export const isVerifiedHandle = (handle?: string) =>
  !!handle && verifiedHandles.has(handle.toLowerCase());

export const count = (n: number) => `${n} prompt${n === 1 ? "" : "s"}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

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
      author: page.data.author,
      updated: page.data.updated,
      stats: statsFor(page.slugs[2]),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
