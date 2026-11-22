---
id: scaffold-project-structure
title: Scaffold the Project Structure
phase: creation
purpose: foundation
one_time: true
tags: [scaffolding, conventions, tooling]
---

# Scaffold the Project Structure

> **When to use:** Once architecture and stack are decided, before writing feature code.
> Run once to establish the folder layout, module boundaries, and conventions everyone
> will follow.

## Context

A greenfield project has no structure yet. The goal is to create a layout that makes the
right thing easy and the wrong thing hard, and that a new contributor can navigate on day one.

## Goal

Produce a concrete project skeleton and a conventions note that the team can commit as the
baseline structure.

## Inputs

Replace these placeholders before running:

- `{{TECH_STACK}}` — languages, frameworks, and package manager.
- `{{ARCHITECTURE}}` — the component/module breakdown from the architecture doc.
- `{{PROJECT_TYPE}}` — web app, API, CLI, library, mobile, data pipeline, etc.
- `{{MONOREPO_OR_NOT}}` — whether this is a single package or a monorepo.
- `{{TEAM_CONVENTIONS}}` — any existing style or naming conventions to honor.

## Instructions

1. Propose a top-level directory layout that mirrors the architecture components, not the
   technical layers (unless the project type demands it).
2. For each top-level directory, state what belongs there and what must NOT go there.
3. Define the conventions: file naming, module boundaries, where tests live, where config
   lives, where docs live, where scripts/automation live.
4. Create the actual directory tree and minimal placeholder files (README per package,
   `.gitignore`, package manifest, entry point) so the project runs `hello world`.
5. List the 3 most common mistakes contributors will make and how the structure prevents them.

## Output format

Produce a single markdown document with these parts, plus the actual scaffolded files:

1. **Summary** — the layout rationale in one paragraph.
2. **Directory tree** — annotated.
3. **Conventions** — naming, boundaries, test location, config location.
4. **Files created** — list of files written.
5. **Next steps** — what to wire up first (CI, tests, linting).

Write the conventions note as `project-structure.md` unless I say otherwise.

## Guardrails

- Do not add tooling, CI, or tests here — that is a separate step. Only scaffold.
- Do not create directories for components that do not exist yet "just in case."
- If the architecture doc is missing, ask for it rather than inventing a structure.
