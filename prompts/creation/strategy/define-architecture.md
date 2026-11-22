---
id: define-architecture
title: Define the Architecture Before Coding
phase: creation
purpose: strategy
one_time: true
tags: [architecture, design, adr]
---

# Define the Architecture Before Coding

> **When to use:** After the tech stack is chosen but before scaffolding. Run once to lock
> in the structural decisions that are expensive to change later.

## Context

You are designing a greenfield system. The stack is decided; now the shape of the system —
boundaries, data flow, deployment units, and quality attributes — must be fixed. This is the
last cheap moment to change them.

## Goal

Produce an architecture description and a short list of Architecture Decision Records (ADRs)
that a team can build against without re-litigating foundational choices.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the system does and who uses it.
- `{{TECH_STACK}}` — the chosen languages, frameworks, and infrastructure.
- `{{QUALITY_ATTRIBUTES}}` — ranked priorities: performance, availability, consistency,
  security, maintainability, cost.
- `{{CONSTRAINTS}}` — team size, timeline, compliance, integration requirements.
- `{{EXISTING_SERVICES}}` — anything it must integrate with.

## Instructions

1. Draw the system context: external actors, external systems, and the system boundary.
2. Decompose into components/modules. For each, state its responsibility and what it must
   NOT do.
3. Describe the key data flows end-to-end, including where data crosses trust boundaries.
4. Identify the deployment units and how they scale independently.
5. For each major decision (monolith vs. services, sync vs. async, where state lives,
   caching strategy), write a one-paragraph ADR: decision, context, alternatives, consequences.
6. Explicitly list the decisions you are *deferred* and the trigger that would force them.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — the architecture in one paragraph.
2. **Component map** — components, responsibilities, boundaries.
3. **Data flows** — numbered flows with trust boundaries marked.
4. **ADRs** — decision, alternatives rejected, consequences.
5. **Deferred decisions** — what is intentionally undecided and why.

Write it as a file named `architecture.md` unless I say otherwise.

## Guardrails

- Do not produce code or folder scaffolding; this is a design document.
- Do not introduce a service boundary without a stated reason (team size, scaling,
  independent deployability). Prefer the simplest structure that meets the quality attributes.
- Every ADR must name at least one alternative that was rejected and why.
