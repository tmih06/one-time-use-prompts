import type { APIRoute, GetStaticPaths } from "astro";
import { generateOGImage } from "fumadocs-ui/og/takumi";
import { appName, getPageImageUrl } from "@/lib/shared";
import { source } from "@/lib/source";

export const getStaticPaths = (() =>
  source.getPages().map((page) => ({
    params: { path: getPageImageUrl(page).segments.join("/") },
    props: { slugs: page.slugs },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const page = source.getPage(props.slugs as string[]);
  if (!page) return new Response(undefined, { status: 404 });

  return generateOGImage({
    title: page.data.title,
    description: page.data.description,
    site: appName,
    format: "webp",
  });
};
