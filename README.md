# one-time-use prompts

A curated library of **one-time-use prompts**: focused instructions meant to be run
**exactly once**, at a specific moment in a project's life.

These are not chat helpers, coding styles, or recurring snippets. Each prompt is a
one-shot "play" for a decision or a setup task that you should only have to do a single
time — choosing a tech stack before the first line of code, adding CI to an app that is
already running, auditing dependencies once before a release, and so on.

Think of this repo as a checklist of _run-this-once_ plays, organized by **when** you run
them and **what they are for**.

## The two phases

Prompts are split by project lifecycle first:

| Phase        | Directory                               | When to use                                                                                                |
| ------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Creation** | [`prompts/creation/`](prompts/creation) | Greenfield. The project does not exist yet, or is a bare skeleton. Run these before or while scaffolding.  |
| **Existing** | [`prompts/existing/`](prompts/existing) | Brownfield. The project is already built and running. Run these to audit, harden, document, or improve it. |

Inside each phase, prompts are grouped by **purpose** (strategy, quality, security, ...).
All prompt metadata — id, title, description, phase, purpose, tags, author, source — lives in
[`prompts/catalog.json`](prompts/catalog.json). The `.md` files themselves contain **only
the prompt text**, so an agent that consumes one is not fed unrelated metadata. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the catalog schema.

## How to use a prompt

1. Pick the prompt for the phase your project is currently in.
2. Read its description to confirm it applies — some are intentionally narrow.
3. Copy the prompt `.md` file into your coding agent as the first message of a fresh
   session. You do not need `catalog.json` — it is for the library, not the agent.
4. Fill in any `{{placeholders}}` with your project's details.
5. Review the result. These prompts ask for a **written artifact** — a decision record, a
   config file, a plan — so treat the output as a draft to review and commit.

> Most prompts are deliberately _read-only in intent_: they produce a recommendation or
> a file for you to approve. Check each prompt's **Guardrails** section before letting an
> agent apply changes directly to a repository.

## Purpose folders

Each phase is divided into purpose folders. Add prompts to the folder that matches their
intent. The current folders are:

### Creation (`prompts/creation/`)

| Folder        | Use for                                                            |
| ------------- | ------------------------------------------------------------------ |
| `strategy/`   | High-level decisions: tech stack, external providers, architecture |
| `foundation/` | Scaffolding, project structure, development environment            |
| `governance/` | License, repository policies, contribution rules                   |

### Existing (`prompts/existing/`)

| Folder           | Use for                                               |
| ---------------- | ----------------------------------------------------- |
| `quality/`       | CI/CD, testing, linting, code quality                 |
| `security/`      | Security audits, dependency reviews, threat modeling  |
| `documentation/` | README, architecture docs, onboarding guides          |
| `operations/`    | Observability, performance, deployment, monitoring    |
| `maintenance/`   | Technical debt, refactoring, upgrades, cleanup        |
| `polish/`        | Fit-and-finish UI passes: visuals, copy, states, a11y |

If a prompt does not fit an existing folder, propose a new one in the PR and explain why.
Keep folder names lowercase and singular.

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
