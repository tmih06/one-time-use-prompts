---
id: assess-tech-debt
title: Assess Technical Debt in an Existing Codebase
phase: existing
purpose: maintenance
one_time: true
tags: [tech-debt, refactoring, maintenance]
---

# Assess Technical Debt in an Existing Codebase

> **When to use:** When a project is already built and the team senses it is slowing down —
> changes are risky, onboarding is hard, or velocity is dropping. Run once to inventory and
> prioritize technical debt.

## Context

The project exists and works, but it carries accumulated debt: outdated dependencies,
poorly structured code, missing tests, documentation gaps, and architectural shortcuts.
The goal is to make debt visible, measurable, and actionable — not to fix everything.

## Goal

Produce a technical debt assessment that categorizes debt, estimates its cost, and provides
a prioritized remediation plan.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the system does and its critical paths.
- `{{TECH_STACK}}` — languages, frameworks, and infrastructure.
- `{{TEAM_CONCERNS}}` — what the team is worried about (slow changes, bugs, onboarding).
- `{{BUSINESS_PRIORITIES}}` — what the business needs next (new features, stability,
  scale).
- `{{TIME_HORIZON}}` — how far ahead to plan (quarter, year).

## Instructions

1. Inventory debt across categories: code quality, architecture, dependencies, testing,
   documentation, infrastructure, and process.
2. For each item, assess: severity (how much it hurts), likelihood of causing problems,
   and cost to fix.
3. Use a simple risk matrix or scoring system to prioritize.
4. Distinguish between debt that blocks business goals and debt that is merely untidy.
5. Recommend a phased plan: quick wins, medium-term fixes, and long-term structural changes.
6. Estimate the effort and risk for each phase.
7. Identify debt that should be accepted (documented and left alone) vs. debt that must be
   paid down.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — debt posture in one paragraph.
2. **Inventory** — categorized list with severity and cost.
3. **Prioritized plan** — phased remediation with effort estimates.
4. **Accepted debt** — what to leave alone and why.
5. **Next steps** — what to tackle first and how to measure progress.

Write it as `tech-debt-assessment.md` unless I say otherwise.

## Guardrails

- Do not treat all debt as equal; focus on what hurts the business.
- Do not recommend a big-bang rewrite; prefer incremental improvement.
- Do not ignore debt that affects security or compliance.
- If the team cannot agree on priorities, propose a decision framework rather than a list.
