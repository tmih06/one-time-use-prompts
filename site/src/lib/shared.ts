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

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "image.webp"];

  return { segments, url: getImageUrl(segments, page.locale) };
}
