---
id: choose-tech-stack
title: Choose the Best-Fit Tech Stack
phase: creation
purpose: strategy
one_time: true
tags: [planning, architecture, decision]
---

# Choose the Best-Fit Tech Stack

> **When to use:** At the very start of a greenfield project, before writing any code,
> once the product goal and rough constraints are known. Run it once per project; revisit
> only after a major pivot.

## Context

You are advising on a brand-new project. Nothing has been coded yet, so there is no legacy
to protect and no existing deployment to disturb. The goal is to pick a stack that fits the
actual problem and the people who will maintain it — not the most popular one.

## Goal

Produce a written tech-stack decision that a reviewer can approve or challenge, with every
choice traced to a concrete constraint rather than a preference.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the product does and who it serves.
- `{{CORE_CONSTRAINTS}}` — the hard limits: team size and skills, budget, deadline,
  compliance needs, performance targets, deployment target.
- `{{EXPECTED_SCALE}}` — rough order of magnitude (users, data volume, requests/sec).
- `{{TEAM_SKILLS}}` — languages/frameworks the team already knows well.
- `{{EXISTING_INTEGRATIONS}}` — systems it must talk to (auth provider, cloud, legacy APIs).

## Instructions

1. Restate the problem in one paragraph and list the 5–8 constraints that actually drive
   the decision. Separate hard constraints (must-haves) from preferences.
2. Propose 2–3 candidate stacks. For each, state what it optimizes for and its known
   weaknesses for *this* project.
3. For each layer (language, framework, database, hosting, observability), recommend one
   choice and justify it against the constraints — not against popularity.
4. Flag any choice that creates lock-in, a hiring risk, or a scaling cliff, and say how
   you would mitigate it.
5. End with a single recommended stack and the 3 decisions that would most change the
   answer if the assumptions were wrong.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — the recommended stack in one paragraph.
2. **Decision table** — layer, choice, why, alternative considered, trade-off accepted.
3. **Risks and mitigations** — lock-in, skills gap, scaling, cost.
4. **Next steps** — what to confirm before scaffolding (spike, benchmark, prototype).

Write it as a file named `tech-stack-decision.md` unless I say otherwise.

## Guardrails

- Do not write any application code; this is a decision document only.
- Do not recommend a stack you cannot justify from the stated constraints.
- If a hard constraint is missing (e.g., no budget or team info), ask for it before
  recommending.
- If the project is not actually greenfield, stop and say so — use an existing-phase prompt.
