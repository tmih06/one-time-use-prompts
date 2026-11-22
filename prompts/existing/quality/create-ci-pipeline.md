---
id: create-ci-pipeline
title: Create Comprehensive CI Checks for a Repo
phase: existing
purpose: quality
one_time: true
tags: [ci, automation, quality]
---

# Create Comprehensive CI Checks for a Repo

> **When to use:** When a project is already built and running but has little or no
> automated checking. Run once to establish a CI pipeline that catches regressions before
> they reach production.

## Context

The project exists and presumably works. The problem is that nothing verifies it
continuously — no automated build, lint, test, or security check runs on every change. The
goal is to add a CI pipeline that gives the team confidence on every commit.

## Goal

Produce a working CI pipeline configuration that runs build, lint, test, and security checks
on every pull request and push to the default branch.

## Inputs

Replace these placeholders before running:

- `{{REPO_URL}}` — the repository to scan.
- `{{LANGUAGE_AND_STACK}}` — languages, frameworks, and build tools.
- `{{HOSTING_PLATFORM}}` — GitHub Actions, GitLab CI, CircleCI, etc.
- `{{TEST_FRAMEWORK}}` — how tests are run (pytest, jest, go test, etc.).
- `{{DEPLOY_TARGET}}` — where the app deploys (cloud, on-prem, serverless) if relevant.
- `{{SECURITY_REQUIREMENTS}}` — any compliance or scanning requirements (SAST, secrets,
  dependencies).

## Instructions

1. Inspect the repository to determine the actual build, test, and lint commands. Do not
   assume; verify by reading the manifests and config files.
2. Recommend a CI provider and justify it (GitHub Actions if on GitHub, etc.).
3. Write the CI configuration with stages: install → lint → typecheck → unit tests →
   integration tests → build → security scans.
4. Add caching for dependencies to keep runs fast.
5. Add a secrets scan (gitleaks or equivalent) and a dependency vulnerability scan
   (Dependabot, Snyk, or OSV).
6. Add a coverage report step if the test framework supports it.
7. Write a short CI.md explaining what runs, when, and how to debug failures.

## Output format

Produce a single markdown document with these parts, plus the CI config file:

1. **Summary** — what the pipeline does in one paragraph.
2. **Pipeline stages** — ordered list with commands.
3. **Files created** — CI config, CI.md, any helper scripts.
4. **Verification** — how to confirm the pipeline works (open a test PR).
5. **Next steps** — what to add later (e2e tests, deployment, preview environments).

Write the config as `.github/workflows/ci.yml` (or the equivalent for the chosen platform)
and the doc as `CI.md` unless I say otherwise.

## Guardrails

- Do not add checks that cannot pass on the current codebase; verify each command locally
  first.
- Do not store secrets in the CI config; use the platform's secret management.
- Do not disable tests to make CI green; fix the tests or the code.
- If the repo has no tests, flag that as a prerequisite and recommend adding them first.
