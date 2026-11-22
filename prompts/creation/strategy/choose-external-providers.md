---
id: choose-external-providers
title: Choose External Providers Over Building From Scratch
phase: creation
purpose: strategy
one_time: true
tags: [planning, vendors, architecture]
---

# Choose External Providers Over Building From Scratch

> **When to use:** During greenfield architecture, once the core domain is understood but
> before infrastructure decisions are locked. Run once to decide what to buy versus build.

## Context

Every new project faces the same trap: rebuilding commodity capabilities (auth, payments,
email, file storage, monitoring) from scratch and burning runway on undifferentiated work.
The goal is to identify which capabilities are commodity (buy) and which are the actual
product (build).

## Goal

Produce a build-vs-buy decision for each non-core capability, with a named provider or a
clear "build" decision and the reasoning.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the product does and what makes it differentiated.
- `{{CORE_DOMAIN}}` — the part of the product that is the actual value proposition.
- `{{TEAM_SIZE_AND_SKILLS}}` — who will operate the chosen services.
- `{{BUDGET_AND_COMPLIANCE}}` — monthly budget ceiling and any regulatory constraints
  (GDPR, HIPAA, SOC 2, data residency).
- `{{EXPECTED_USAGE}}` — rough volumes (users, transactions, emails/month) to price against.

## Instructions

1. List every capability the product needs that is *not* the core domain (auth, payments,
   email, SMS, file storage, search, analytics, error tracking, CI, hosting, etc.).
2. For each capability, decide **buy** or **build** using this test: is it differentiated
   to *this* product, or is it a solved problem someone else maintains?
3. For each "buy" decision, shortlist 2–3 providers and compare on: pricing at expected
   usage, lock-in risk, compliance fit, operational burden, and exit cost.
4. For each "build" decision, state why a provider is unacceptable and what it would cost
   to build and maintain.
5. Flag capabilities where a provider could become a single point of failure or a cost
   cliff, and recommend a fallback.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — the buy/build split in one paragraph.
2. **Decision table** — capability, decision, provider(s), why, exit cost.
3. **Cost sketch** — rough monthly cost at expected usage for the "buy" set.
4. **Next steps** — which providers to spike or POC before committing.

Write it as a file named `external-providers-decision.md` unless I say otherwise.

## Guardrails

- Do not recommend building commodity infrastructure unless you can name a concrete reason
  a provider fails (compliance, cost at scale, control, offline requirement).
- Do not assume a provider is compliant; verify against the stated compliance constraints.
- If expected usage is unknown, give both a low and high estimate rather than guessing one.
