# Contributing

Thanks for helping grow this library. A good prompt here is short, specific, and run
once. Before opening a PR, check that your prompt belongs in this repo at all.

## Does it belong here?

A prompt fits if it is:

- **One-time:** run once at a particular point in a project's life, not every day.
- **Phased:** clearly tied to either project _creation_ or an _existing_ project.
- **Purposeful:** solves one specific problem (a decision, an audit, a setup task).
- **Self-contained:** works without the rest of a conversation as context.

If it is a recurring helper or a general coding rule, it probably does not belong here.

## Where does it go?

Use this two-level layout:

```
prompts/
├── creation/       # greenfield: project does not exist yet
│   ├── strategy/   # high-level decisions (stack, providers, architecture)
│   ├── foundation/ # scaffolding, structure, local environment
│   └── governance/ # licensing, repo policies, contribution rules
└── existing/       # brownfield: project is already built
    ├── quality/    # CI/CD, testing, linting
    ├── security/   # audits, dependencies, secrets, threat models
    ├── documentation/
    ├── operations/ # observability, performance, deployment
    └── maintenance/# tech debt, refactoring, upgrades
```

If your prompt does not fit an existing purpose folder, propose a new one in the PR and
explain why. Keep folder names lowercase and singular.

## Prompt format

Each prompt is one markdown file that contains **only the prompt text** — no YAML
frontmatter. The file is fed directly to an agent, so metadata that the agent does not
need must not be in it. All metadata lives in [`prompts/catalog.json`](prompts/catalog.json).

Copy [templates/prompt-template.md](templates/prompt-template.md) and fill it in.

### 1. Add a catalog entry

Append an object to `prompts/catalog.json` under `prompts`:

```json
{
  "id": "your-prompt-id",
  "title": "Your Prompt Title",
  "description": "One sentence on when to use this prompt.",
  "phase": "existing",
  "purpose": "quality",
  "one_time": true,
  "tags": ["quality", "ci"],
  "author": "name, handle, or profile URL (optional)",
  "source": "https://x.com/user/status/123 (optional, or a list of URLs)"
}
```

| Field         | Required | Notes                                                            |
| ------------- | -------- | ---------------------------------------------------------------- |
| `id`          | yes      | Kebab-case, must equal the filename without `.md`                |
| `title`       | yes      | Title case. Never repeated in the `.md` file                     |
| `description` | yes      | One sentence on when to use it. Never repeated in the `.md` file |
| `phase`       | yes      | `creation` or `existing`, must match the folder                  |
| `purpose`     | yes      | Folder name, must match the folder                               |
| `one_time`    | yes      | Always `true`                                                    |
| `tags`        | yes      | 2–5 lowercase strings                                            |
| `author`      | no       | Who wrote it. Omit entirely if unknown                           |
| `source`      | no       | URL or list of URLs. Omit entirely if original                   |

The file path is derived as `prompts/<phase>/<purpose>/<id>.md`. Set `author` and
`source` when a prompt came from elsewhere; if either is unknown, ask the contributor —
do not guess or drop it silently. `x.com`/`twitter.com` status URLs render as a static
tweet card on the site; deleted or protected tweets fall back to a plain link chip.

### 2. Write the prompt file

- Start directly with the first section — no frontmatter, no `# Title` heading, no
  **When to use** note. Title and description live only in `catalog.json`.
- Use `{{PLACEHOLDER}}` tokens for values the user must fill in. Never hard-code a
  specific company, framework, or path where a placeholder would do.
- Have these sections, in order: **Context**, **Goal**, **Inputs**, **Instructions**, **Output format**, **Guardrails**.
- End with an **Output format** that asks for a concrete, reviewable artifact — a
  decision record, config file, or plan. Avoid "just answer in chat" prompts.

### 3. Validate

```bash
python3 scripts/validate-catalog.py        # metadata <-> file consistency
python3 scripts/scan-prompt-injection.py prompts/existing/quality/your-prompt.md
```

## Naming

Prompt filenames are lowercase kebab-case and describe the action:
`your-prompt-name.md`. The filename must equal the catalog `id`.

## Final checklist

- [ ] Catalog entry has all required fields; `phase`/`purpose`/`id` match the file path.
- [ ] Prompt file has **no** frontmatter, `# Title` heading, or **When to use** note — it
      starts with `## Context`.
- [ ] `id` is unique across the catalog.
- [ ] If the prompt was adapted from elsewhere, `author` and `source` credit the
      original author and URL.
- [ ] Placeholders are consistent between **Inputs** and **Instructions**.
- [ ] **Guardrails** state whether the agent may modify files.
- [ ] The prompt passes the injection scanner and `validate-catalog.py`.
- [ ] The prompt is listed in the [README.md](README.md) purpose folder table if it
      introduces a new folder, or in the folder's index if one exists.
- [ ] Markdown links resolve.

See [CONTRIBUTING-SECURITY.md](CONTRIBUTING-SECURITY.md) and
[SECURITY.md](SECURITY.md) for the full security review process.

Open a PR with a short description of when the prompt should be used.
