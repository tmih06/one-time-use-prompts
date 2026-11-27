export interface GalleryPrompt {
  id: string;
  title: string;
  description: string;
  phase: string;
  purpose: string;
  tags: string[];
  preview: string[];
  author?: string;
  updated?: string;
  stats?: {
    totalViews: number;
    totalCopies: number;
  };
}

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "updated", label: "Recently updated" },
  { value: "copies", label: "Most copied" },
  { value: "views", label: "Most viewed" },
  { value: "title", label: "Title A–Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

/** Enough tags to cover the common facets without turning the row into a tag cloud. */
export const INITIAL_TAG_COUNT = 12;

/** JSON inside a script tag must not be able to close that tag. */
export const serializeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export function tagFacets(prompts: GalleryPrompt[]) {
  const counts = new Map<string, number>();
  for (const prompt of prompts) {
    for (const tag of prompt.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, n]) => ({ tag, n }))
    .sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
}

const updatedTime = (prompt: GalleryPrompt) => {
  const time = prompt.updated ? Date.parse(prompt.updated) : 0;
  return Number.isFinite(time) ? time : 0;
};

const popularity = (prompt: GalleryPrompt) =>
  (prompt.stats?.totalCopies ?? 0) * 5 + (prompt.stats?.totalViews ?? 0);

const titleCollator = new Intl.Collator("en", { sensitivity: "base" });

/**
 * Match the client's default "recommended" order so enhancement does not reshuffle
 * the first paint: proven prompts first, then fresh ones, then title.
 */
export function recommendedOrder<T extends GalleryPrompt>(prompts: T[]): T[] {
  return [...prompts].sort(
    (a, b) =>
      popularity(b) - popularity(a) ||
      updatedTime(b) - updatedTime(a) ||
      titleCollator.compare(a.title, b.title),
  );
}

/**
 * Structured metadata for scripts/gallery.ts. Keeping it in one JSON block avoids
 * duplicating searchable text across data attributes on every card.
 */
export function galleryIndex(prompts: GalleryPrompt[]) {
  return recommendedOrder(prompts).map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    phase: prompt.phase,
    purpose: prompt.purpose,
    tags: prompt.tags,
    preview: prompt.preview,
    author: prompt.author,
    updated: prompt.updated,
    views: prompt.stats?.totalViews ?? 0,
    copies: prompt.stats?.totalCopies ?? 0,
  }));
}
