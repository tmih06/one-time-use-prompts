# Contributing

Thanks for helping grow this library. A good prompt here is short, specific, and run
once. Before opening a PR, check that your prompt belongs in this repo at all.

## Does it belong here?

A prompt fits if it is:

- **One-time:** run once at a particular point in a project's life, not every day.
- **Phased:** clearly tied to either project *creation* or an *existing* project.
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

Copy [templates/prompt-template.md](templates/prompt-template.md) and fill it in. Every
prompt must:

1. Include YAML frontmatter with these fields:

   | Field | Type | Example |
   |-------|------|---------|
   | `id` | string | `your-prompt-id` |
   | `title` | string | `Your Prompt Title` |
   | `phase` | `creation` or `existing` | `creation` |
   | `purpose` | string (folder name) | `strategy` |
   | `one_time` | boolean, always `true` | `true` |
   | `tags` | list of strings | `[architecture, planning]` |
   | `source` | URL or list of URLs, optional | `https://x.com/user/status/123` |

2. Use `{{PLACEHOLDER}}` tokens for values the user must fill in. Never hard-code a
   specific company, framework, or path where a placeholder would do.

3. Have these sections, in order: **When to use**, **Context**, **Goal**, **Inputs**,
   **Instructions**, **Output format**, **Guardrails**.

4. End with an **Output format** that asks for a concrete, reviewable artifact — a
   decision record, config file, or plan. Avoid "just answer in chat" prompts.

5. If the prompt came from elsewhere — an X post, a blog, another repo — set `source`
   in the frontmatter so readers can trace it back to the original. Omit the field
   entirely if the prompt is original.

## Naming

Prompt filenames are lowercase kebab-case and describe the action:
`your-prompt-name.md`.

## Final checklist

- [ ] Frontmatter is valid and `phase` / `purpose` match the folder path.
- [ ] `id` is unique across the repo (grep for it).
- [ ] If the prompt was adapted from elsewhere, `source` credits the original URL.
- [ ] Placeholders are consistent between **Inputs** and **Instructions**.
- [ ] **Guardrails** state whether the agent may modify files.
- [ ] The prompt passes the injection scanner:
      `python3 scripts/scan-prompt-injection.py prompts/path/to/your-prompt.md`
- [ ] The prompt is listed in the [README.md](README.md) purpose folder table if it
      introduces a new folder, or in the folder's index if one exists.
- [ ] Markdown links resolve.

See [CONTRIBUTING-SECURITY.md](CONTRIBUTING-SECURITY.md) and
[SECURITY.md](SECURITY.md) for the full security review process.

Open a PR with a short description of when the prompt should be used.
