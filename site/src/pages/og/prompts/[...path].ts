import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";
import { createElement } from "react";
import { ImageResponse } from "takumi-js/response";
import { HomeBanner, PromptBanner, bannerSize } from "@/lib/og-banner";
import { getPrompts, PHASES, purposeTitle } from "@/lib/prompts";
import { getPageImageUrl } from "@/lib/shared";
import { source } from "@/lib/source";

export const getStaticPaths = (() =>
  source.getPages().map((page) => ({
    params: { path: getPageImageUrl(page).segments.join("/") },
    props: { slugs: page.slugs },
  }))) satisfies GetStaticPaths;

/** Geist (sans) is built into Takumi; the logotype and the mono caps use the site's own fonts. */
const font = (name: string, file: string, weight: number) => ({
  name,
  // Astro builds from the site/ directory, which is where public/ lives.
  data: readFileSync(resolve("public/fonts", file)),
  weight,
});
const fonts = [
  font("Orbitron", "orbitron-core.woff2", 700),
  font("Geist Mono", "geist-mono-core.woff2", 500),
];

/**
 * Prompt pages (phase/purpose/id) get a banner about that prompt; everything else
 * (home, phase indexes) gets the library banner.
 */
export const GET: APIRoute = ({ props }) => {
  const slugs = props.slugs as string[];
  if (!source.getPage(slugs)) return new Response(undefined, { status: 404 });

  const prompts = getPrompts();
  const prompt = slugs.length >= 3 ? prompts.find((p) => p.splat === slugs.join("/")) : undefined;
  const phase = PHASES.find((p) => p.slug === prompt?.phase);

  const banner =
    prompt && phase
      ? createElement(PromptBanner, {
          title: prompt.title,
          description: prompt.description,
          phase: phase.title,
          kicker: phase.kicker,
          purpose: purposeTitle(prompt.purpose),
          tags: prompt.tags,
        })
      : createElement(HomeBanner, {
          count: prompts.length,
          phases: PHASES.filter((p) => prompts.some((x) => x.phase === p.slug)),
        });

  return new ImageResponse(banner, { ...bannerSize, format: "webp", fonts });
};
