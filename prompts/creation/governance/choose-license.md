---
id: choose-license
title: Choose a License
phase: creation
purpose: governance
one_time: true
tags: [legal, open-source, governance]
---

# Choose a License

> **When to use:** Early in a greenfield project, before the first public commit. Run once;
> changing a license later is painful and can require consent from all contributors.

## Context

A project without a license is not open source — it is "all rights reserved" by default, and
nobody can legally use it. The choice of license is a business and legal decision, not a
technical one, and it should be made deliberately.

## Goal

Produce a license recommendation with reasoning, and apply it to the repository if approved.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the project is and what it does.
- `{{INTENDED_USE}}` — open-source library, internal tool, commercial product, SaaS, etc.
- `{{BUSINESS_MODEL}}` — how the project relates to revenue (if any).
- `{{COMPANY_OR_INDIVIDUAL}}` — who owns the copyright.
- `{{EXISTING_DEPENDENCIES}}` — licenses of key dependencies (to check compatibility).

## Instructions

1. Ask whether the project is intended to be open source, source-available, or proprietary.
   If proprietary, recommend keeping it private and skip to step 5.
2. For open source, shortlist 2–3 licenses from the permissive (MIT, Apache-2.0, BSD),
   weak copyleft (LGPL, MPL), and strong copyleft (GPL, AGPL) families.
3. Compare them on: commercial use allowed, derivative works, patent grant, network use
   (AGPL), attribution requirements, compatibility with existing dependencies.
4. Recommend one license and explain why it fits the business model and intended use.
5. If approved, add a `LICENSE` file, a copyright header policy, and a `NOTICE` file if the
   license requires it.
6. Document the decision in a short ADR so future contributors know why.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — the recommended license in one sentence.
2. **Comparison** — licenses considered, key differences, dependency compatibility.
3. **Recommendation** — the license and why.
4. **Files created** — `LICENSE`, `NOTICE`, header policy.
5. **Next steps** — what to do before the first public release.

Write it as `license-decision.md` unless I say otherwise.

## Guardrails

- Do not provide legal advice; state that the recommendation should be reviewed by a lawyer
  for commercial projects.
- Do not recommend AGPL unless you understand the network-use implications and the user
  accepts them.
- Do not change an existing license without explicit confirmation.
