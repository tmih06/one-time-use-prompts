---
id: run-performance-audit
title: Run a Performance Audit on a Built Project
phase: existing
purpose: operations
one_time: true
tags: [performance, optimization, profiling]
---

# Run a Performance Audit on a Built Project

> **When to use:** When a project is already built and running but performance is a
> concern — slow responses, high resource usage, or user complaints. Run once to find
> bottlenecks and prioritize fixes.

## Context

The application works but is slow or resource-hungry. The team has guesses about what is
slow but no data. The goal is to measure, identify the real bottlenecks, and produce a
prioritized optimization plan — not to optimize everything.

## Goal

Produce a performance audit report that identifies the top bottlenecks with evidence and
provides a prioritized plan to improve the metrics that matter.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the application does and its critical paths.
- `{{TECH_STACK}}` — languages, frameworks, and infrastructure.
- `{{PERFORMANCE_CONCERNS}}` — what is slow or expensive (page load, API latency, memory,
  CPU, database queries, cost).
- `{{TRAFFIC_PROFILE}}` — expected load (users, requests/sec, data volume).
- `{{EXISTING_METRICS}}` — any current performance data or monitoring.
- `{{BUDGET_CONSTRAINTS}}` — infrastructure cost limits.

## Instructions

1. Define the performance metrics that matter: latency (p50, p95, p99), throughput,
   resource usage (CPU, memory, I/O), and cost.
2. Establish a baseline: measure current performance under representative load.
3. Profile the critical paths: identify hot spots in code, database queries, and external
   calls.
4. For each bottleneck, provide: evidence (profile, trace, or measurement), impact, and
   estimated effort to fix.
5. Prioritize fixes by impact-to-effort ratio.
6. Recommend quick wins vs. structural changes.
7. Suggest how to prevent regressions (performance tests, budgets, monitoring).

## Output format

Produce a single markdown document with these parts:

1. **Summary** — performance posture in one paragraph.
2. **Metrics** — what was measured and the baseline.
3. **Bottlenecks** — ranked list with evidence and impact.
4. **Prioritized plan** — quick wins first, then structural changes.
5. **Prevention** — how to catch regressions early.
6. **Next steps** — what to measure after fixes.

Write it as `performance-audit.md` unless I say otherwise.

## Guardrails

- Do not optimize without measuring; guessing wastes effort.
- Do not sacrifice correctness or maintainability for marginal performance gains.
- Do not recommend infrastructure changes without considering cost.
- If the application has no performance monitoring, flag that as a prerequisite.
