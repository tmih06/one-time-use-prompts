import { llms, loader } from "fumadocs-core/source";
import { pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import { z } from "zod";
import { docsRoute } from "./shared";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    async: true,
    // Catalog metadata injected by scripts/sync-prompts.ts (absent on index pages).
    schema: pageSchema.extend({
      phase: z.string().optional(),
      purpose: z.string().optional(),
      tags: z.array(z.string()).optional(),
      // First lines of the prompt, for the home page cards (see scripts/sync-prompts.ts).
      preview: z.array(z.string()).optional(),
      author: z.string().optional(),
      source: z.array(z.string()).optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText("processed")}`,
});
