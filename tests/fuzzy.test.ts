import { describe, expect, test } from "bun:test";
import { fuzzyScore, relevantFuzzyScore, tokenize } from "../site/src/lib/fuzzy";

const webPerformance = {
  title: "Audit Web Performance",
  description: "Once per site, when page speed or Core Web Vitals need a full audit.",
  tags: ["performance", "web", "core-web-vitals", "audit", "full-stack"],
  phase: "existing",
  purpose: "operations",
};

const reactApp = {
  title: "Build a Fast Client-Rendered React App",
  description: "Once per greenfield app, when starting a fast client-rendered React project.",
  tags: ["react", "vite", "tanstack", "performance", "frontend"],
  phase: "creation",
  purpose: "foundation",
};

const untangle = {
  title: "Untangle Codebase",
  description: "Once per codebase, when it has grown tangled.",
  tags: ["refactoring", "tech-debt", "architecture", "agents"],
  phase: "existing",
  purpose: "maintenance",
};

describe("tokenize", () => {
  test("normalizes case, separators and diacritics", () => {
    expect(tokenize("Core-Web  Vitals café")).toEqual(["core", "web", "vitals", "cafe"]);
  });
});

describe("fuzzyScore", () => {
  test("matches exact title and tag terms", () => {
    expect(fuzzyScore("performance", webPerformance).matched).toBe(true);
    expect(fuzzyScore("core web vitals", webPerformance).matched).toBe(true);
  });

  test("requires every query term, but lets terms come from different fields", () => {
    expect(fuzzyScore("react vite", reactApp).matched).toBe(true);
    expect(fuzzyScore("react vitest", reactApp).matched).toBe(false);
  });

  test("tolerates small typos in longer terms", () => {
    const result = fuzzyScore("performnce", webPerformance);
    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  test("matches acronyms inside a single tag or phrase", () => {
    expect(fuzzyScore("cwv", webPerformance).matched).toBe(true);
  });

  test("matches ordered subsequences without matching arbitrary noise", () => {
    expect(fuzzyScore("utgl", untangle).matched).toBe(true);
    expect(fuzzyScore("xyz", untangle).matched).toBe(false);
  });

  test("keeps short exact searches precise when a strong match exists", () => {
    const exact = {
      title: "Audit and Fix a Site's SEO Readiness",
      tags: ["seo", "audit"],
    };
    const incidental = {
      title: "Set Up Observability",
      description: "Measure operations and exceptions.",
      tags: ["operations"],
    };
    const scores = [exact, incidental].map((doc) => fuzzyScore("seo", doc).score);
    const best = Math.max(...scores);
    const relevant = [exact, incidental].filter((_, i) => relevantFuzzyScore(scores[i], best));
    expect(relevant).toEqual([exact]);
  });

  test("does not treat a different short word as a typo", () => {
    expect(
      fuzzyScore("vite", {
        title: "Audit and Fix a Site's SEO Readiness",
        description: "Inspect every public site route.",
      }).matched,
    ).toBe(false);
  });

  test("ranks title matches above description-only matches", () => {
    const titled = fuzzyScore("performance", webPerformance).score;
    const proseOnly = fuzzyScore("performance", {
      ...webPerformance,
      title: "Audit a Website",
      tags: ["audit"],
      description: "Measure performance carefully.",
    }).score;
    expect(titled).toBeGreaterThan(proseOnly);
  });
});
