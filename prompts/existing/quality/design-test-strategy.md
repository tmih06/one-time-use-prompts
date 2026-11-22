---
id: design-test-strategy
title: Design a Test Strategy for an Existing Codebase
phase: existing
purpose: quality
one_time: true
tags: [testing, quality, strategy]
---

# Design a Test Strategy for an Existing Codebase

> **When to use:** When a project is already built but has inconsistent, missing, or
> unmaintainable tests. Run once to establish a testing approach that scales with the team.

## Context

The project exists and has some tests (or none). The problem is not the absence of tests
but the absence of a *strategy* — which layers to use, what to test, how much coverage is
enough, and how tests stay fast and reliable. The goal is a coherent testing approach.

## Goal

Produce a testing strategy document that defines test layers, tooling, coverage targets,
and conventions for the existing codebase.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the system does and its critical paths.
- `{{TECH_STACK}}` — languages, frameworks, and existing test tools.
- `{{CURRENT_TEST_STATE}}` — what tests exist today, their coverage, and their pain points.
- `{{TEAM_SIZE}}` — who will write and maintain tests.
- `{{CRITICAL_PATHS}}` — the flows that must never break (payments, auth, data integrity).

## Instructions

1. Inventory the existing tests: what layers exist (unit, integration, e2e), what they
   cover, and where the gaps are.
2. Recommend a test pyramid for this project: the right mix of unit, integration, and e2e
   tests, with justification.
3. Define coverage targets per layer (not a single global number).
4. Recommend tooling: test runner, mocking library, coverage tool, snapshot testing, etc.
4. Define conventions: test file location, naming, fixture patterns, how to handle flaky
   tests.
5. Identify the critical paths that need the most coverage and propose the first tests to
   write.
6. Estimate the effort to reach the target state and propose a phased rollout.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — the strategy in one paragraph.
2. **Current state** — inventory of existing tests and gaps.
3. **Target pyramid** — layers, ratios, coverage targets.
4. **Tooling** — recommended tools and why.
5. **Conventions** — file layout, naming, fixtures.
6. **First tests to write** — prioritized list.
7. **Next steps** — phased rollout plan.

Write it as `test-strategy.md` unless I say otherwise.

## Guardrails

- Do not recommend a coverage target that the team cannot maintain; coverage is a means,
  not an end.
- Do not mandate e2e tests for everything; reserve them for critical user journeys.
- If the codebase has no tests at all, acknowledge that and propose a bootstrap plan.
