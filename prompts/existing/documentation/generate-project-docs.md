---
id: generate-project-docs
title: Generate Project Documentation from the Codebase
phase: existing
purpose: documentation
one_time: true
tags: [docs, onboarding, maintenance]
---

# Generate Project Documentation from the Codebase

> **When to use:** When a project is already built but its documentation is missing,
> outdated, or scattered. Run once to produce a coherent documentation set from the actual
> code, not from memory.

## Context

The project exists and works, but documentation is either absent or no longer reflects the
code. New contributors struggle to onboard, and the team wastes time answering the same
questions. The goal is accurate, maintainable documentation derived from the code itself.

## Goal

Produce a documentation set — README, architecture overview, API reference, and onboarding
guide — that accurately reflects the current codebase.

## Inputs

Replace these placeholders before running:

- `{{REPO_URL}}` — the repository to document.
- `{{TECH_STACK}}` — languages, frameworks, and build tools.
- `{{TARGET_AUDIENCE}}` — who reads the docs (new contributors, users, operators, all).
- `{{EXISTING_DOCS}}` — any existing documentation to update or replace.
- `{{PUBLIC_API}}` — whether the project exposes a public API that needs reference docs.

## Instructions

1. Read the codebase to understand structure, entry points, and key modules.
2. Write a README that covers: what it does, how to install, how to run, how to test, and
   how to contribute.
3. Write an architecture overview: components, data flow, and key design decisions.
4. If there is a public API, generate reference docs from code annotations or OpenAPI specs.
5. Write an onboarding guide: first-day setup, common tasks, where to find things.
6. Add a docs index or table of contents.
7. Flag any code that is undocumented or has misleading comments.

## Output format

Produce a single markdown document with these parts, plus the actual doc files:

1. **Summary** — what documentation was produced.
2. **README** — draft or updated README.
3. **Architecture** — overview with diagram or description.
4. **API reference** — if applicable.
5. **Onboarding guide** — step-by-step for new contributors.
6. **Files created/updated** — list.
7. **Next steps** — how to keep docs in sync (CI checks, review process).

Write the docs in the repository's existing docs location, or create a `docs/` folder if
none exists, unless I say otherwise.

## Guardrails

- Do not invent features or APIs that do not exist in the code.
- Do not copy code into docs; link to it instead.
- Do not document internal implementation details that are not relevant to the audience.
- If the codebase is too large, prioritize the most-used modules and say so.
