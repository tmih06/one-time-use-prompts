---
id: audit-dependencies
title: Audit Third-Party Dependencies
phase: existing
purpose: security
one_time: true
tags: [dependencies, supply-chain, vulnerabilities]
---

# Audit Third-Party Dependencies

> **When to use:** When a project is already built and has accumulated dependencies, or
> before a security-sensitive release. Run once to review the supply chain for risk.

## Context

Every project depends on third-party packages. Over time, dependencies become stale,
vulnerable, abandoned, or bloated. The goal is to know what you are shipping, what is safe,
and what needs attention — before someone else finds out.

## Goal

Produce a dependency audit report that categorizes dependencies by risk and provides a
prioritized upgrade or removal plan.

## Inputs

Replace these placeholders before running:

- `{{REPO_URL}}` — the repository to audit.
- `{{PACKAGE_MANAGERS}}` — which ecosystems are in use (npm, pip, Maven, Go modules, etc.).
- `{{LOCK_FILES}}` — whether lock files are committed (they should be).
- `{{DEPLOYMENT_CONTEXT}}` — production, staging, internal tool.
- `{{UPDATE_POLICY}}` — how aggressively the team wants to update (conservative, balanced,
  aggressive).

## Instructions

1. Inventory all direct and transitive dependencies with versions and licenses.
2. Check for known vulnerabilities using the ecosystem's advisory database (npm audit,
  pip-audit, OSV, GitHub Dependabot, etc.).
3. Identify abandoned or unmaintained packages (no commits in 12+ months, archived repos).
4. Identify bloated dependencies: packages that pull in large dependency trees for a small
   feature.
5. Check license compatibility: are all licenses compatible with the project's license?
6. Prioritize: critical vulnerabilities first, then abandoned packages, then bloat.
7. Recommend a phased update plan that minimizes breakage risk.

## Output format

Produce a single markdown document with these parts:

1. **Summary** — dependency health in one paragraph.
2. **Inventory** — total count, direct vs. transitive, license breakdown.
3. **Vulnerabilities** — severity, package, version, fixed version, remediation.
4. **Abandoned packages** — list with risk assessment.
5. **Bloat** — packages that could be replaced or removed.
6. **Prioritized plan** — what to update, replace, or remove, and when.

Write it as `dependency-audit.md` unless I say otherwise.

## Guardrails

- Do not recommend updating to a version that breaks the build without testing it.
- Do not flag a package as vulnerable based on a single scanner; cross-reference advisories.
- Do not recommend removing a package without checking for transitive dependencies.
- If the project has no lock file, flag that as a critical issue and fix it first.
