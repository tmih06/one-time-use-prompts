import type { APIRoute } from "astro";
import { publicUrls } from "@/lib/seo";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The XML sitemap: exactly the public-index pages, each with the date its content last changed. */
export const GET: APIRoute = ({ site }) => {
  const entries = publicUrls().map(
    ({ path, lastmod }) =>
      `  <url>\n    <loc>${escape(new URL(path, site).href)}</loc>\n${
        lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""
      }  </url>`,
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
};
