import { defineConfig } from "vite-plus";

export default defineConfig({
  // Prompt sources and generated files are lint/formatted by other tools
  // (validate-catalog.py, fumadocs at build time) — keep vp out of them.
  lint: {
    ignorePatterns: ["prompts/**", "site/content/docs/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["prompts/**", "site/content/docs/**"],
  },
});
