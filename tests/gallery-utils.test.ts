import { describe, expect, test } from "bun:test";
import {
  galleryIndex,
  recommendedOrder,
  serializeJson,
  tagFacets,
} from "../site/src/lib/gallery-utils";
import type { GalleryPrompt } from "../site/src/lib/gallery-utils";

const prompt = (overrides: Partial<GalleryPrompt>): GalleryPrompt => ({
  id: "example",
  title: "Example",
  description: "An example prompt.",
  phase: "existing",
  purpose: "quality",
  tags: [],
  preview: [],
  ...overrides,
});

describe("tagFacets", () => {
  test("counts tags and sorts by frequency then name", () => {
    const facets = tagFacets([
      prompt({ id: "a", tags: ["seo", "audit"] }),
      prompt({ id: "b", tags: ["seo", "performance"] }),
      prompt({ id: "c", tags: ["audit"] }),
    ]);
    expect(facets).toEqual([
      { tag: "audit", n: 2 },
      { tag: "seo", n: 2 },
      { tag: "performance", n: 1 },
    ]);
  });
});

describe("recommendedOrder", () => {
  test("sorts by weighted popularity, then freshness, then title", () => {
    const ordered = recommendedOrder([
      prompt({ id: "old", title: "Old", updated: "2024-01-01" }),
      prompt({ id: "fresh", title: "Fresh", updated: "2025-01-01" }),
      prompt({
        id: "copied",
        title: "Copied",
        updated: "2023-01-01",
        stats: { totalViews: 0, totalCopies: 2 },
      }),
    ]);
    expect(ordered.map((p) => p.id)).toEqual(["copied", "fresh", "old"]);
  });
});

describe("gallery index serialization", () => {
  test("uses the same recommended order as the rendered cards", () => {
    const index = galleryIndex([
      prompt({ id: "plain", title: "Plain" }),
      prompt({
        id: "popular",
        title: "Popular",
        stats: { totalViews: 10, totalCopies: 0 },
      }),
    ]);
    expect(index.map((p) => p.id)).toEqual(["popular", "plain"]);
  });

  test("escapes script-closing HTML in embedded JSON", () => {
    expect(serializeJson({ markup: "</script><script>" })).toBe(
      '{"markup":"\\u003c/script>\\u003cscript>"}',
    );
  });
});
