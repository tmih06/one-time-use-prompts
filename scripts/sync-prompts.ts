#!/usr/bin/env bun
/**
 * Generate the fumadocs content tree from prompts/ + prompts/catalog.json.
 *
 * Prompt .md files stay metadata-free — this script injects the catalog
 * metadata (title, phase, purpose, tags, author, source) as frontmatter —
 * the site renders it as tags under the page title — so it is searchable
 * without polluting the source files that agents consume.
 *
 * Output: site/content/docs/ — a generated directory. Do not hand-edit it.
 * Everything under it except .gitkeep is wiped and regenerated.
 *
 * Usage: bun run scripts/sync-prompts.ts
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const PROMPTS_DIR = path.join(ROOT, "prompts");
const CATALOG = path.join(PROMPTS_DIR, "catalog.json");
const OUT_DIR = path.join(ROOT, "site", "content", "docs");

interface CatalogEntry {
  id: string;
  title: string;
  phase: "creation" | "existing";
  purpose: string;
  one_time: boolean;
  tags: string[];
  author?: string;
  source?: string | string[];
}

interface Catalog {
  prompts: CatalogEntry[];
}

const PHASE_TITLES: Record<string, string> = {
  creation: "Creation (greenfield)",
  existing: "Existing (brownfield)",
};

const PURPOSE_TITLES: Record<string, string> = {
  strategy: "Strategy",
  foundation: "Foundation",
  governance: "Governance",
  quality: "Quality",
  security: "Security",
  documentation: "Documentation",
  operations: "Operations",
  maintenance: "Maintenance",
};

const yaml = (v: string): string => JSON.stringify(v);

/** Extract the "> **When to use:** …" sentence to use as the page description. */
function extractWhenToUse(body: string): string | undefined {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => /^>\s*\*\*When to use:\*\*/.test(l));
  if (start === -1) return undefined;
  const parts: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(/^>\s?(.*)$/);
    if (!m) break;
    parts.push(m[1].replace(/^\*\*When to use:\*\*\s*/, ""));
  }
  const text = parts.join(" ").trim();
  return text.length > 0 ? text : undefined;
}

async function main(): Promise<void> {
  const catalog = (await Bun.file(CATALOG).json()) as Catalog;
  const entries = [...catalog.prompts].sort((a, b) => a.id.localeCompare(b.id));

  const phases = [...new Set(entries.map((e) => e.phase))].sort();
  const errors: string[] = [];

  // Wipe and rebuild the generated tree (only the parts this script owns).
  // Remove the contents, not OUT_DIR itself — deleting the directory detaches
  // vite's file watcher and a running dev server keeps serving stale pages.
  await mkdir(OUT_DIR, { recursive: true });
  for (const child of await readdir(OUT_DIR)) {
    await rm(path.join(OUT_DIR, child), { recursive: true, force: true });
  }

  // Read every prompt once (in parallel); both the page and the index use it.
  const bodies = new Map<string, string>();
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(PROMPTS_DIR, entry.phase, entry.purpose, `${entry.id}.md`);
      try {
        bodies.set(entry.id, await readFile(srcPath, "utf-8"));
      } catch {
        errors.push(`missing prompt file for catalog entry '${entry.id}': ${srcPath}`);
      }
    }),
  );

  // Group prompts by phase -> purpose for folder/index generation.
  const byPhase = new Map<string, Map<string, CatalogEntry[]>>();
  for (const entry of entries) {
    if (!bodies.has(entry.id)) continue;
    if (!byPhase.has(entry.phase)) byPhase.set(entry.phase, new Map());
    const purposes = byPhase.get(entry.phase)!;
    if (!purposes.has(entry.purpose)) purposes.set(entry.purpose, []);
    purposes.get(entry.purpose)!.push(entry);
  }

  // --- Per-prompt pages -------------------------------------------------
  const pageWrites = [...byPhase.values()]
    .flatMap((purposes) => [...purposes.values()].flat())
    .map(async (entry) => {
      const body = bodies.get(entry.id)!;
      const description = extractWhenToUse(body) ?? `${entry.phase} / ${entry.purpose}`;

      // Show the raw prompt inside a fenced code block — readers copy it, not
      // read it rendered. The fence must be longer than any backtick run in
      // the prompt so embedded code blocks stay inside.
      const prompt = body.trim();
      const maxRun = Math.max(3, ...(prompt.match(/`+/g) ?? []).map((r) => r.length + 1));
      const fence = "`".repeat(maxRun);
      const promptBlock = `${fence}markdown title="${entry.id}.md" lineNumbers\n${prompt}\n${fence}`;

      const mdx = [
        "---",
        `title: ${yaml(entry.title)}`,
        `description: ${yaml(description)}`,
        `phase: ${yaml(entry.phase)}`,
        `purpose: ${yaml(entry.purpose)}`,
        `tags: ${JSON.stringify(entry.tags)}`,
        ...(entry.author ? [`author: ${yaml(entry.author)}`] : []),
        ...(entry.source === undefined
          ? []
          : [
              `source: ${JSON.stringify(Array.isArray(entry.source) ? entry.source : [entry.source])}`,
            ]),
        "---",
        "",
        promptBlock,
        "",
      ].join("\n");

      const destDir = path.join(OUT_DIR, entry.phase, entry.purpose);
      await mkdir(destDir, { recursive: true });
      await writeFile(path.join(destDir, `${entry.id}.md`), mdx);
    });
  await Promise.all(pageWrites);

  // --- Folder metadata ---------------------------------------------------
  await writeFile(
    path.join(OUT_DIR, "meta.json"),
    JSON.stringify({ title: "Prompt Library", pages: ["index", ...phases] }, null, 2),
  );

  for (const [phase, purposes] of byPhase) {
    const phaseDir = path.join(OUT_DIR, phase);
    const purposeNames = [...purposes.keys()].sort();
    await writeFile(
      path.join(phaseDir, "meta.json"),
      JSON.stringify(
        { title: PHASE_TITLES[phase] ?? phase, pages: ["index", ...purposeNames] },
        null,
        2,
      ),
    );
    for (const [purpose, items] of purposes) {
      await writeFile(
        path.join(phaseDir, purpose, "meta.json"),
        JSON.stringify(
          { title: PURPOSE_TITLES[purpose] ?? purpose, pages: items.map((i) => i.id).sort() },
          null,
          2,
        ),
      );
    }
  }

  // --- Generated landing pages -------------------------------------------
  const count = entries.length;
  const phaseCards = phases
    .map((p) => `  <Card title="${PHASE_TITLES[p] ?? p}" href="/docs/${p}" />`)
    .join("\n");

  await writeFile(
    path.join(OUT_DIR, "index.mdx"),
    [
      "---",
      "title: One-Time-Use Prompts",
      "description: A curated library of prompts that run exactly once, organized by project lifecycle phase and purpose.",
      "---",
      "",
      `A curated library of **${count} one-time-use prompt${count === 1 ? "" : "s"}** — focused`,
      "instructions meant to be run exactly once, at a specific moment in a project\u2019s life.",
      "",
      "Pick the phase your project is in:",
      "",
      "<Cards>",
      phaseCards,
      "</Cards>",
      "",
      "Use the search (Ctrl/Cmd+K) to find a prompt by name, tag, purpose, or content.",
      "",
    ].join("\n"),
  );

  for (const [phase, purposes] of byPhase) {
    const lines: string[] = [
      "---",
      `title: ${yaml(PHASE_TITLES[phase] ?? phase)}`,
      `description: ${yaml(`Prompts for the ${phase} phase of a project's life.`)}`,
      "---",
      "",
    ];
    for (const [purpose, items] of [...purposes.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      lines.push(`## ${PURPOSE_TITLES[purpose] ?? purpose}`, "");
      for (const item of items.sort((a, b) => a.title.localeCompare(b.title))) {
        const desc = extractWhenToUse(bodies.get(item.id)!) ?? "";
        lines.push(`- **[${item.title}](/docs/${phase}/${purpose}/${item.id})** — ${desc}`);
      }
      lines.push("");
    }
    await writeFile(path.join(OUT_DIR, phase, "index.md"), lines.join("\n"));
  }

  // Keep the generated dir in git even when it is empty.
  await writeFile(path.join(OUT_DIR, ".gitkeep"), "");

  // --- Report --------------------------------------------------------------
  for (const e of errors) console.error(`  ${e}`);
  console.log(
    `Synced ${entries.length - errors.length}/${entries.length} prompt(s) to ${path.relative(ROOT, OUT_DIR)}`,
  );
  if (errors.length > 0) process.exit(1);
}

await main();
