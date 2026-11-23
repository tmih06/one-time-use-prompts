import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import type { Plugin } from "vite";

/** Astro compiles every .md import itself; the prompt library belongs to Fumadocs. */
const leaveDocsToFumadocs: Plugin = {
  name: "leave-docs-to-fumadocs",
  configResolved(config) {
    const markdown = config.plugins.find((plugin) => plugin.name === "astro:markdown");
    if (!markdown?.load || typeof markdown.load !== "object") {
      throw new Error("astro:markdown load hook not found");
    }
    const load = markdown.load as { handler: (this: unknown, id: string) => unknown };
    const { handler } = load;
    load.handler = function (id) {
      return id.includes("/content/docs/") ? undefined : handler.call(this, id);
    };
  },
};

export default defineConfig({
  output: "static",
  server: { port: 3000 },
  devToolbar: { enabled: false },
  integrations: [react()],
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
  // "file" output avoids the redirect Cloudflare Pages adds for directory indexes.
  build: { format: "file", inlineStylesheets: "always" },
  vite: {
    plugins: [leaveDocsToFumadocs, fumadocsMdx(), tailwindcss()],
    // Takumi (OG images) ships native/wasm binaries, so it must stay external.
    // react-tweet imports CSS modules, so it must be bundled rather than externalized.
    resolve: {
      alias: { tslib: "tslib/tslib.es6.js" },
      noExternal: ["react-tweet"],
    },
    ssr: {
      external: ["takumi-js", "@takumi-rs/core", "@takumi-rs/wasm", "@takumi-rs/helpers"],
      noExternal: ["react-tweet"],
    },
  },
});
