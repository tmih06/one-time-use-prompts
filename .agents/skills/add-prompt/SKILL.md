---
name: add-prompt
description: Add a new one-time-use prompt to this repository in the correct format and folder. Use when the user asks to add a prompt, pastes prompt text, or shares a link to a prompt (e.g., an X post, blog, or gist).
---

# /add-prompt

Help the user add a new prompt to this repo. A prompt is two parts:

- **Body** — `prompts/<phase>/<purpose>/<kebab-name>.md` containing ONLY the prompt text
  (no frontmatter). This file is fed to an agent, so keep metadata out of it.
- **Metadata** — an entry in `prompts/catalog.json`.

`templates/prompt-template.md` shows the body shape. The full rules are in
`CONTRIBUTING.md` — this skill is the fast path.

## Procedure

### 1. Get the prompt text and missing metadata

- If the user pasted the prompt, use it as-is.
- If the user gave a file path, read it.
- If the user gave a link (X post, blog, gist, repo file), fetch it, extract the prompt
  text, and remember the URL — it becomes the `source` field in the catalog.
- **Ask for anything that is missing. Do not guess and do not silently drop info.**
  Before writing, confirm with the user:
  - `author` — who wrote this prompt (name, handle, or profile URL). Ask even if the
    user did not volunteer it.
  - `source` — the original URL, if the prompt is not original and none was given.
  - `phase` / `purpose` — if the classification is ambiguous.
  - `tags` — if none are obvious from the content.
    Ask once, collect the answers, then write. Never fill optional fields with guesses.

### 2. Classify phase and purpose

Ask: is the project already built when this prompt runs?

- **creation** — project does not exist yet, or is a bare skeleton. Folders:
  - `strategy/` — high-level decisions: tech stack, providers, architecture
  - `foundation/` — scaffolding, structure, dev environment
  - `governance/` — license, repo policies, contribution rules
- **existing** — project is already built and running. Folders:
  - `quality/` — CI/CD, testing, linting, quality gates
  - `security/` — audits, dependencies, secrets, threat models
  - `documentation/` — READMEs, architecture docs, onboarding
  - `operations/` — observability, performance, deployment
  - `maintenance/` — tech debt, refactoring, upgrades

Pick exactly one folder. If none fits, propose a new purpose folder to the user before
creating it (lowercase, singular). If the phase is ambiguous, ask — do not guess.

### 3. Write the prompt file

Copy `templates/prompt-template.md` to `prompts/<phase>/<purpose>/<kebab-name>.md` and
fill it in. Keep the author's content faithful — reformat, do not rewrite meaning.

- Start with `## Context` — **no frontmatter, no `# Title` heading, no `> **When to use:**`
  note**. Title and description live only in `catalog.json`.
- Sections in order: `## Context`, `## Goal`, `## Inputs`,
  `## Instructions`, `## Output format`, `## Guardrails`.
- Use `{{UPPER_SNAKE}}` placeholders for anything the user must supply. Never hard-code a
  specific company, framework, or path where a placeholder belongs. If the prompt is
  self-contained, say so in **Inputs**.
- Preserve the author's structure inside **Instructions** (phases, numbered steps).
- If the source prompt has rules up front, put them in **Guardrails** and note in
  Context that they are binding.
- End with an **Output format** that asks for a concrete artifact, not chat output.

Filename = the `id` (lowercase kebab-case describing the action).

### 4. Add the catalog entry

Append to `prompts/catalog.json`:

```json
{
  "id": "<filename without .md>",
  "title": "Title Case",
  "description": "one sentence on when to use it",
  "phase": "creation|existing",
  "purpose": "<folder>",
  "one_time": true,
  "tags": ["2-5", "lowercase"],
  "author": "optional — omit entirely if unknown",
  "source": "optional URL or list — omit entirely if original"
}
```

### 5. Validate

```bash
python3 scripts/validate-catalog.py
python3 scripts/scan-prompt-injection.py prompts/<phase>/<purpose>/<file>.md
```

Both must pass. Then re-read the file and confirm: all seven sections in order, no
frontmatter, placeholders in **Inputs** match those in **Instructions**.

### 6. Update docs and commit

- If you created a new purpose folder, add it to the folder table in `README.md` and to
  `CONTRIBUTING.md`.
- The new prompt appears on the docs site automatically — `bun run sync` regenerates
  `site/content/docs/` from `prompts/` + `catalog.json` on every `dev`/`build`.
- Commit with a conventional commit: `feat: add <id> prompt`.
- If `source` was set, mention the origin in the PR description.

## Do not

- Do not water down or "improve" the author's content — reformat only.
- Do not put frontmatter in a prompt file — metadata belongs in `catalog.json`.
- Do not skip the scanner or the catalog validator even if the prompt looks safe.
- Do not put a recurring-use prompt in this repo.
- Do not add a per-prompt index to `README.md` — it lists folders only.
