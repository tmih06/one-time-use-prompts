<!--
Prompt template — copy this file and fill in the {{PLACEHOLDERS}}.

Prompt files contain ONLY the prompt text. Do not add YAML frontmatter here —
metadata (id, title, phase, purpose, author, source, tags) lives in
prompts/catalog.json so the file itself is clean input for an agent.

Add an entry to prompts/catalog.json:

  {
    "id": "<kebab-case, must match this filename without .md>",
    "title": "<Prompt Title>",
    "phase": "creation | existing",
    "purpose": "<folder name>",
    "one_time": true,
    "tags": ["tag1", "tag2"],
    "author": "<optional: name, handle, or profile URL>",
    "source": "<optional: URL or list of URLs>"
  }

Then validate: python3 scripts/validate-catalog.py
-->

# {{PROMPT_TITLE}}

> **When to use:** {{One sentence: the exact moment in a project's life when this
> should be run, and who runs it.}}

## Context

{{What the agent needs to know about the project to do a good job. State assumptions
explicitly. For a creation prompt, note that little or no code exists yet; for an
existing prompt, note that the codebase is already live.}}

## Goal

{{One or two sentences describing the single outcome this prompt produces.}}

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — {{what to put here}}
- `{{CONSTRAINT}}` — {{what to put here}}

Or, if the prompt is self-contained and discovers everything from the repository
itself, state that here instead of listing placeholders.

## Instructions

1. {{First concrete instruction to the agent.}}
2. {{Second concrete instruction. Ask the agent to ask clarifying questions if a
   required input is missing.}}
3. {{Keep steps imperative and independent of conversation history.}}

## Output format

Produce a single markdown document with these parts:

1. **Summary** — one paragraph.
2. **Findings / Recommendation** — the substance, with reasoning.
3. **Next steps** — a short, ordered list.

Write it as a file named `{{SUGGESTED_FILENAME}}.md` unless I say otherwise.

## Guardrails

- Do not {{ thing that must not happen }}.
- {{State clearly whether the agent may modify repository files or only propose them.}}
- If critical information is missing, stop and ask instead of guessing.
