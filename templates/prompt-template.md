---
id: {{PROMPT_ID}}
title: {{PROMPT_TITLE}}
phase: {{creation|existing}}
purpose: {{FOLDER_NAME}}
one_time: true
tags: [{{TAG_1}}, {{TAG_2}}]
# Optional: who wrote this prompt — a name, handle, or profile URL.
# Remove this line entirely if the author prefers not to say.
author: {{AUTHOR_NAME_OR_HANDLE}}
# Optional: where this prompt came from — a URL (e.g., an X post, blog, or repo),
# or a list of URLs. Remove this line entirely if the prompt is original.
source: {{SOURCE_URL}}
---

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
