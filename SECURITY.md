# Security Policy

This repository is a collection of prompts that are meant to be fed into LLM agents. A
malicious prompt can instruct an agent to exfiltrate data, execute arbitrary commands,
modify files it should not, or leak system instructions. Because of this, we treat every
contribution as a potential security risk and review it accordingly.

## Threat model

The primary risks are:

1. **Prompt injection** — a prompt that instructs the agent to ignore its system
   instructions, reveal secrets, or perform unauthorized actions.
2. **Indirect injection** — a prompt that causes the agent to fetch and obey instructions
   from an external source (URL, file, dependency).
3. **Data exfiltration** — a prompt that causes the agent to send sensitive data to an
   attacker-controlled endpoint.
4. **Supply chain attacks** — a prompt that causes the agent to install or execute
   malicious packages or scripts.
5. **Obfuscation** — a prompt that hides malicious instructions in encoding, Unicode, or
   typoglycemia to evade detection.

## Reporting a vulnerability

If you discover a malicious or unsafe prompt in this repository, please report it
privately:

- Open a [GitHub Security Advisory](https://github.com/tmih06/one-time-use-prompts/security/advisories/new)
  (replace `OWNER/REPO` with the actual repository path).
- Do **not** open a public issue for security vulnerabilities.
- Include the file path, the suspicious content, and why you believe it is malicious.

We will acknowledge reports within 48 hours and aim to resolve critical issues within 7
days.

## Review process

Every contribution goes through the following checks before merge:

### Layer 1 — Automated scanners (blocking)

These run in CI on every pull request and must pass:

| Scanner | What it catches |
|---------|----------------|
| `scripts/scan-prompt-injection.py` | Known injection patterns, encoding tricks, exfiltration endpoints, hidden instructions |
| `gitleaks` | Hardcoded secrets, API keys, tokens in the prompt text |
| `semgrep` (with `p/prompt-injection` ruleset) | Structural injection patterns across the markdown |

A prompt that fails any scanner is rejected automatically. The contributor must fix the
issue or justify the false positive in the PR.

### Layer 2 — LLM judge (advisory)

An LLM-based review (configured in CI or run manually) evaluates each new prompt for:

- Whether it asks the agent to do something outside its stated purpose.
- Whether it contains instructions that could be interpreted as overriding system prompts.
- Whether it requests access to files, network, or credentials it does not need.
- Whether the output format could be used to smuggle data out of the agent's context.

The judge's output is advisory; it flags prompts for human review but does not block merge
on its own.

### Layer 3 — Human review (required)

A maintainer reviews every prompt that touches `prompts/` or `templates/`. The reviewer
checks:

- [ ] The prompt's `phase` and `purpose` match its folder path.
- [ ] The prompt does not instruct the agent to ignore system instructions or reveal
      secrets.
- [ ] The prompt does not request network access, file system access, or command execution
      unless explicitly justified and scoped.
- [ ] The prompt's `Guardrails` section clearly states what the agent may and may not do.
- [ ] The prompt does not contain obfuscated or encoded instructions.
- [ ] The prompt does not reference external URLs or files that could change after review.

## What we reject

- Prompts that instruct the agent to ignore, override, or reveal system instructions.
- Prompts that exfiltrate data to external endpoints.
- Prompts that execute arbitrary commands or install untrusted packages without explicit
  user consent.
- Prompts that use encoding, Unicode tricks, or typoglycemia to hide instructions.
- Prompts that request access to credentials, environment variables, or sensitive files
  without a clear, scoped justification.

## What we allow

- Prompts that ask the agent to analyze code, generate documentation, or produce decision
  documents.
- Prompts that modify files within the project's scope (e.g., scaffolding, CI config)
  when the `Guardrails` section explicitly permits it.
- Prompts that reference external documentation or APIs for research, as long as they do
  not instruct the agent to fetch and obey instructions from those sources.

## Security updates

If a vulnerability is found in an existing prompt, we will:

1. Remove or quarantine the affected prompt immediately.
2. Add a regression test to the scanner to prevent re-introduction.
3. Notify users who may have already used the prompt.
4. Document the incident in the repository's security log.
