---
id: setup-repo-policies
title: Set Up Repository Policies
phase: creation
purpose: governance
one_time: true
tags: [governance, branching, code-review]
---

# Set Up Repository Policies

> **When to use:** Early in a greenfield project, once the repo exists on a host (GitHub,
> GitLab, etc.) but before the team starts merging. Run once to establish the rules that
> keep the codebase healthy as it grows.

## Context

A new repository has no rules. Without branch protection, code review requirements, and
clear ownership, quality degrades quickly as contributors grow. This prompt establishes the
governance baseline.

## Goal

Produce a set of repository policies — branching strategy, protection rules, ownership, and
contribution guidelines — that can be configured on the host.

## Inputs

Replace these placeholders before running:

- `{{HOSTING_PLATFORM}}` — GitHub, GitLab, Bitbucket, self-hosted, etc.
- `{{TEAM_SIZE}}` — number of active contributors.
- `{{RELEASE_CADENCE}}` — how often releases ship (continuous, weekly, monthly).
- `{{COMPLIANCE_REQUIREMENTS}}` — any audit or review requirements (SOC 2, HIPAA, etc.).
- `{{EXISTING_REPOS}}` — any existing repos whose conventions should be followed.

## Instructions

1. Recommend a branching strategy (trunk-based, GitHub flow, GitFlow) based on team size and
   release cadence. Justify the choice.
2. Define branch protection rules for the default branch: required reviews, status checks,
   signed commits, linear history, etc.
3. Define a CODEOWNERS file: who reviews what, and how ownership is assigned.
4. Write a CONTRIBUTING.md outline: how to propose changes, coding standards, commit message
   conventions, PR checklist.
5. Define a PR template that enforces the checklist (tests, docs, security review).
6. List the settings to configure on the host and the exact values to use.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — the governance model in one paragraph.
2. **Branching strategy** — recommendation and rationale.
3. **Protection rules** — exact settings for the host.
4. **CODEOWNERS** — proposed ownership map.
5. **CONTRIBUTING.md** — outline or full draft.
6. **PR template** — markdown template.
7. **Next steps** — what to configure on the host.

Write it as `repo-policies.md` unless I say otherwise.

## Guardrails

- Do not enable rules that the team cannot realistically satisfy (e.g., requiring two
  reviewers for a solo project).
- Do not recommend GitFlow for a small team unless there is a specific reason.
- If compliance requirements are mentioned, flag which rules map to which requirement.
