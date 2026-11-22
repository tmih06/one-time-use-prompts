---
id: setup-observability
title: Set Up Observability for a Running Application
phase: existing
purpose: operations
one_time: true
tags: [observability, monitoring, reliability]
---

# Set Up Observability for a Running Application

> **When to use:** When a project is already built and deployed but lacks visibility into
> its runtime behavior. Run once to add logging, metrics, tracing, and alerting.

## Context

The application is live but the team cannot see what it is doing. When something breaks,
they find out from users, not from alerts. The goal is to add observability so the team can
understand system behavior, diagnose issues, and measure performance.

## Goal

Produce a working observability setup — structured logging, key metrics, distributed
tracing, and alerting — that the team can use to monitor and debug the application.

## Inputs

Replace these placeholders before running:

- `{{PROJECT_DESCRIPTION}}` — what the application does and its critical paths.
- `{{TECH_STACK}}` — languages, frameworks, and infrastructure.
- `{{DEPLOYMENT_CONTEXT}}` — cloud provider, on-prem, serverless, containers.
- `{{EXISTING_TOOLS}}` — any current logging or monitoring (CloudWatch, Datadog, etc.).
- `{{TEAM_SIZE}}` — who will respond to alerts.
- `{{SLO_TARGETS}}` — any uptime or performance targets (e.g., 99.9% availability).

## Instructions

1. Define the observability pillars: what logs, metrics, and traces are needed for the
   critical paths.
2. Recommend a tool stack (e.g., OpenTelemetry + Prometheus + Grafana, or a managed
   service like Datadog/CloudWatch) and justify it.
3. Implement structured logging: JSON format, correlation IDs, log levels, and PII
   redaction.
4. Define key metrics: request rate, error rate, latency percentiles, saturation, and
   business metrics (orders, signups, etc.).
5. Add distributed tracing for the critical request paths.
6. Define alerting rules: what triggers an alert, who gets paged, and what the runbook says.
7. Write a dashboard for the most important views (service health, error rate, latency).

## Output format

Produce a single markdown document with these parts, plus the implementation:

1. **Summary** — the observability approach in one paragraph.
2. **Tool stack** — chosen tools and why.
3. **Logging** — format, levels, correlation, PII handling.
4. **Metrics** — list with definitions and targets.
5. **Tracing** — what is traced and how.
6. **Alerting** — rules, thresholds, runbook links.
7. **Dashboard** — description or JSON if applicable.
8. **Files created/modified** — list.

Write the implementation in the codebase and the docs as `observability.md` unless I say
otherwise.

## Guardrails

- Do not log sensitive data (passwords, tokens, PII) even in debug mode.
- Do not add observability overhead that materially degrades performance; measure it.
- Do not alert on everything; alert on what requires human action.
- If the team has no on-call rotation, recommend a simpler alerting strategy.
