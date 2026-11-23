import { createGetUrl } from "fumadocs-core/source";

export const appName = "One-Time-Use Prompts";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: "tmih06",
  repo: "one-time-use-prompts",
  branch: "master",
};

export const repoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
export const contributingUrl = `${repoUrl}/blob/${gitConfig.branch}/CONTRIBUTING.md`;

/**
 * GitHub URL for a docs page's source. Prompt pages come from
 * `prompts/<phase>/<purpose>/<id>.md`; the generated index pages (`index.mdx`,
 * `<phase>/index.md`) have no source file, so they link to the folder instead.
 * (`site/content/docs` itself is generated and not in the repo.)
 */
export function getSourceUrl(path: string): string {
  const segments = path.split("/");
  const isIndex = /^index\.mdx?$/.test(segments[segments.length - 1]);
  if (isIndex) {
    const dir = ["prompts", ...segments.slice(0, -1)].join("/");
    return `${repoUrl}/tree/${gitConfig.branch}/${encodeURI(dir)}`;
  }
  return `${repoUrl}/blob/${gitConfig.branch}/prompts/${encodeURI(path)}`;
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "image.webp"];

  return { segments, url: getImageUrl(segments, page.locale) };
}
