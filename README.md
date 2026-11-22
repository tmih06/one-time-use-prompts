# one-time-use prompts

A curated library of **one-time-use prompts**: focused instructions meant to be run
**exactly once**, at a specific moment in a project's life.

These are not chat helpers, coding styles, or recurring snippets. Each prompt is a
one-shot "play" for a decision or a setup task that you should only have to do a single
time — choosing a tech stack before the first line of code, adding CI to an app that is
already running, auditing dependencies once before a release, and so on.

Think of this repo as a checklist of *run-this-once* plays, organized by **when** you run
them and **what they are for**.

## The two phases

Prompts are split by project lifecycle first:

| Phase | Directory | When to use |
|-------|-----------|-------------|
| **Creation** | [`prompts/creation/`](prompts/creation) | Greenfield. The project does not exist yet, or is a bare skeleton. Run these before or while scaffolding. |
| **Existing** | [`prompts/existing/`](prompts/existing) | Brownfield. The project is already built and running. Run these to audit, harden, document, or improve it. |

Inside each phase, prompts are grouped by **purpose** (strategy, quality, security, ...).
Every prompt declares its `phase` and `purpose` in YAML frontmatter, so the structure is
consistent and machine-readable. See [CONTRIBUTING.md](CONTRIBUTING.md) for the exact
schema.

## How to use a prompt

1. Pick the prompt for the phase your project is currently in.
2. Read its **When to use** note to confirm it applies — some are intentionally narrow.
3. Copy the prompt into your coding agent as the first message of a fresh session.
4. Fill in any `{{placeholders}}` with your project's details.
5. Review the result. These prompts ask for a **written artifact** — a decision record, a
   config file, a plan — so treat the output as a draft to review and commit.

> Most prompts are deliberately *read-only in intent*: they produce a recommendation or
> a file for you to approve. Check each prompt's **Guardrails** section before letting an
> agent apply changes directly to a repository.

## Index

### Creation — greenfield

| Purpose | Prompt | Use it to |
|---------|--------|-----------|
| Strategy | [Choose the best-fit tech stack](prompts/creation/strategy/choose-tech-stack.md) | Pick languages, frameworks, and runtimes from real constraints. |
| Strategy | [Choose external providers](prompts/creation/strategy/choose-external-providers.md) | Decide what to buy vs. build (auth, DB, email, payments, hosting...). |
| Strategy | [Define the architecture](prompts/creation/strategy/define-architecture.md) | Lock in boundaries, data flow, and quality attributes before coding. |
| Foundation | [Scaffold the project structure](prompts/creation/foundation/scaffold-project-structure.md) | Lay out folders, modules, and conventions for a new repo. |
| Foundation | [Set up the development environment](prompts/creation/foundation/setup-development-environment.md) | Define toolchain, local setup, and onboarding steps. |
| Governance | [Choose a license](prompts/creation/governance/choose-license.md) | Pick an OSS license that matches your goals. |
| Governance | [Set up repository policies](prompts/creation/governance/setup-repo-policies.md) | Establish branch protection, CODEOWNERS, and contribution rules. |

### Existing — brownfield

| Purpose | Prompt | Use it to |
|---------|--------|-----------|
| Quality | [Create comprehensive CI checks](prompts/existing/quality/create-ci-pipeline.md) | Add a full CI pipeline (build, lint, test, security) to an existing repo. |
| Quality | [Design a test strategy](prompts/existing/quality/design-test-strategy.md) | Decide test layers, tooling, and coverage goals for an existing codebase. |
| Security | [Run a security audit](prompts/existing/security/run-security-audit.md) | Find and prioritize security risks in a built project. |
| Security | [Audit dependencies](prompts/existing/security/audit-dependencies.md) | Review third-party packages for risk, staleness, and upgrades. |
| Documentation | [Generate project documentation](prompts/existing/documentation/generate-project-docs.md) | Produce README, architecture, and onboarding docs from the code. |
| Operations | [Set up observability](prompts/existing/operations/setup-observability.md) | Add logging, metrics, tracing, and alerting to a running app. |
| Operations | [Run a performance audit](prompts/existing/operations/performance-audit.md) | Identify bottlenecks and prioritize performance fixes. |
| Maintenance | [Assess technical debt](prompts/existing/maintenance/assess-tech-debt.md) | Inventory and rank tech debt into an actionable plan. |

## Trust & safety

Because these prompts are fed into LLM agents, every contribution goes through a
three-layer security review: automated scanners, an LLM judge, and human review. See
[SECURITY.md](SECURITY.md) for the full process and
[CONTRIBUTING-SECURITY.md](CONTRIBUTING-SECURITY.md) for contributor guidance.

## Adding a prompt

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the
[prompt template](templates/prompt-template.md), then add your prompt to the index above.
All contributions must pass the security review described in
[SECURITY.md](SECURITY.md).

## License

See [LICENSE](LICENSE).
