# Contributing Security

Because this repository contains prompts that are fed into LLM agents, security review is
part of every contribution. See [SECURITY.md](SECURITY.md) for the full threat model and
review process.

## Before you submit

Run the local scanner on your prompt before opening a PR:

```bash
python3 scripts/scan-prompt-injection.py prompts/your/prompt.md
```

If the scanner reports critical or high findings, fix them before submitting. Medium
findings require justification in the PR description.

## What to avoid

Do not include prompts that:

- Tell the agent to ignore or override system instructions.
- Ask the agent to reveal secrets, credentials, or environment variables.
- Instruct the agent to send data to external URLs or webhooks.
- Use encoding, Unicode tricks, or typoglycemia to hide instructions.
- Ask the agent to modify files outside the project's scope.
- Instruct the agent to skip code review or hide its actions.

## Reporting a security issue

If you find a malicious prompt already in the repository, report it privately via
[GitHub Security Advisory](https://github.com/tmih06/one-time-use-prompts/security/advisories/new).
Do not open a public issue.
