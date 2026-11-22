---
name: add-prompt
description: Add a new one-time-use prompt to this repository in the correct format and folder. Use when the user asks to add a prompt, pastes prompt text, or shares a link to a prompt (e.g., an X post, blog, or gist).
---

# /add-prompt

Help the user add a new prompt to this repo. Every prompt lives in
`prompts/<phase>/<purpose>/<kebab-name>.md` and must match
`templates/prompt-template.md`. The full rules are in `CONTRIBUTING.md` — this skill is
the fast path.

## Procedure

### 1. Get the prompt text

- If the user pasted the prompt, use it as-is.
- If the user gave a file path, read it.
- If the user gave a link (X post, blog, gist, repo file), fetch it, extract the prompt
  text, and remember the URL — it becomes the `source` frontmatter field.
- If the prompt is incomplete or ambiguous (e.g., unclear what it produces or when to run
  it), ask before writing.

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

### 3. Create the prompt file

Copy `templates/prompt-template.md` and fill it in:

- `id` — unique kebab-case id (usually the filename). Grep the repo to confirm it is unused.
- `title` — title case, describes the action.
- `phase` / `purpose` — must match the folder path exactly.
- `one_time` — always `true`. If the prompt is meant to run repeatedly, tell the user it
  does not belong in this repo.
- `tags` — 2–5 lowercase tags.
- `source` — include only if the prompt came from elsewhere; set the original URL.
  Omit the field entirely for original prompts.

Filename: lowercase kebab-case describing the action (`setup-go-quality-gate.md`).

### 4. Restructure the content into the required sections

Keep the author's content faithful — reformat, do not rewrite meaning. Map to this order:

1. `> **When to use:**` — one sentence naming the exact moment to run this prompt.
2. `## Context` — what the agent needs to know; state assumptions explicitly.
3. `## Goal` — the single outcome produced.
4. `## Inputs` — `{{PLACEHOLDER}}` tokens the user must replace. If the prompt is
   self-contained (discovers everything from the repo itself), say so.
5. `## Instructions` — the imperative steps. Preserve the author's structure
   (phases, numbered steps) inside this section.
6. `## Output format` — the concrete, reviewable artifact produced.
7. `## Guardrails` — hard constraints: what the agent must never do. If the source prompt
   has rules up front, move them here and note in Context to read them first.

Use `{{UPPER_SNAKE}}` placeholders for anything the user must supply. Never hard-code a
specific company, framework version, or path where a placeholder belongs.

### 5. Validate

Run before committing:

```bash
python3 scripts/scan-prompt-injection.py prompts/<phase>/<purpose>/<file>.md
```

Must pass with no critical/high findings. Then verify by reading the file:

- frontmatter fields present, `phase`/`purpose` match the path, `id` unique
- all seven sections present in order
- placeholders used in Inputs also appear in Instructions

### 6. Update docs and commit

- If you created a new purpose folder, add it to the folder table in `README.md` and to
  `CONTRIBUTING.md`.
- Commit with a conventional commit: `feat: add <id> prompt`.
- If `source` was set, mention the origin in the PR description.

## Do not

- Do not water down or "improve" the author's content — reformat only.
- Do not skip the scanner even if the prompt looks safe.
- Do not put a recurring-use prompt in this repo.
- Do not add an index entry for a single prompt in `README.md` — it lists folders only.
