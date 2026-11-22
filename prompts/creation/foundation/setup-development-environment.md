---
id: setup-development-environment
title: Set Up the Development Environment
phase: creation
purpose: foundation
one_time: true
tags: [tooling, onboarding, dx]
---

# Set Up the Development Environment

> **When to use:** Right after scaffolding, before the team starts feature work. Run once to
> make "clone and run" work for every contributor.

## Context

A new project has code but no reproducible local setup. Without this, every developer
wastes time on environment issues and onboarding stalls. The goal is a single command or a
short documented sequence that gets a contributor from clone to running app.

## Goal

Produce a working local development setup and an onboarding document that a new contributor
can follow without help.

## Inputs

Replace these placeholders before running:

- `{{TECH_STACK}}` — languages, frameworks, runtime versions.
- `{{PROJECT_TYPE}}` — web app, API, CLI, mobile, etc.
- `{{REQUIRED_SERVICES}}` — databases, caches, message brokers, external APIs needed locally.
- `{{TEAM_OS}}` — which operating systems must be supported (macOS, Linux, Windows).
- `{{EXISTING_TOOLS}}` — any version manager or container runtime the team already uses
  (nvm, pyenv, mise, docker, etc.).

## Instructions

1. Decide how dependencies and services are provided: containerized (Docker/Dev Containers)
   or native (version manager + scripts). Recommend one and justify it.
2. Pin runtime and dependency versions. Do not leave "latest" anywhere.
3. Write the setup commands: install, configure, seed data, run.
4. Write the verify commands: how to know it worked (health check, test run, URL).
5. Document known gotchas: ports, env vars, services that must be started manually, OS
   differences.
6. Create a `.env.example` with every required variable and a comment per variable.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — the setup approach in one paragraph.
2. **Prerequisites** — what must be installed before starting.
3. **Setup steps** — numbered, copy-pasteable.
4. **Verify** — how to confirm it works.
5. **Troubleshooting** — the 5 most likely failures and fixes.
6. **Files created** — list of files written.

Write it as `development-setup.md` unless I say otherwise.

## Guardrails

- Do not commit secrets or real credentials; use placeholders and `.env.example` only.
- Do not assume a container runtime if the team has not chosen one; state the assumption.
- Every command must be tested in a clean environment, not just on your machine.
