---
id: run-security-audit
title: Run a Security Audit on a Built Project
phase: existing
purpose: security
one_time: true
tags: [security, audit, vulnerability]
---

# Run a Security Audit on a Built Project

> **When to use:** When a project is already built and running, especially before a
> security-sensitive release, a compliance audit, or after a major change. Run once to find
> and prioritize security risks.

## Context

The project exists and is presumably functional. The question is not "does it work?" but
"can it be exploited?" The goal is a prioritized list of security findings with evidence
and remediation steps — not a generic checklist.

## Goal

Produce a security audit report that identifies real vulnerabilities, rates them by
severity, and provides concrete remediation steps.

## Inputs

Replace these placeholders before running:

- `{{REPO_URL}}` — the repository to audit.
- `{{TECH_STACK}}` — languages, frameworks, and infrastructure.
- `{{DEPLOYMENT_CONTEXT}}` — where it runs (cloud, on-prem, internet-facing, internal).
- `{{DATA_SENSITIVITY}}` — what data it handles (PII, financial, health, none).
- `{{COMPLIANCE_REQUIREMENTS}}` — any regulatory or certification requirements.
- `{{KNOWN_CONCERNS}}` — any specific areas the team is worried about.

## Instructions

1. Map the attack surface: entry points (APIs, UI, webhooks, file uploads), trust
   boundaries, and data flows.
2. Check for the OWASP Top 10 (or the relevant equivalent): injection, broken auth,
   sensitive data exposure, XXE, broken access control, security misconfiguration,
   XSS, insecure deserialization, vulnerable components, insufficient logging.
3. For each finding, provide: evidence (file/line or config), impact, likelihood, and
   remediation.
4. Prioritize findings using a simple risk matrix (likelihood × impact).
5. Identify quick wins (fixes that are cheap and high-impact) vs. structural issues.
6. Recommend the next audit trigger (after major changes, quarterly, etc.).

## Output format

Produce a single markdown document with these parts:

1. **Summary** — overall risk posture in one paragraph.
2. **Attack surface map** — entry points and trust boundaries.
3. **Findings** — severity, evidence, impact, remediation.
4. **Prioritized remediation plan** — quick wins first.
5. **Next steps** — what to do next and when to re-audit.

Write it as `security-audit.md` unless I say otherwise.

## Guardrails

- Do not report theoretical vulnerabilities without evidence; verify each finding.
- Do not recommend fixes that break functionality without noting the trade-off.
- Do not include exploit code that could be used maliciously; describe the attack at a
  high level.
- If the codebase is too large to audit thoroughly, scope the audit and say so.
