# Prompt Security Review Checklist

Use this checklist when reviewing a new or modified prompt. Every item must be checked
before merge. If any item fails, the prompt is rejected or sent back for revision.

## Catalog and structure

- [ ] `prompts/catalog.json` entry has all required fields and `validate-catalog.py` passes.
- [ ] `id` is unique across the repository and equals the filename without `.md`.
- [ ] `phase` and `purpose` in the catalog match the folder path (`creation`/`existing` + subfolder).
- [ ] `one_time` is `true`.
- [ ] The `.md` file contains **only the prompt** — no YAML frontmatter.
- [ ] All required sections are present and in order: When to use, Context, Goal, Inputs,
      Instructions, Output format, Guardrails.

## Injection resistance

- [ ] The prompt does not contain phrases like "ignore previous instructions", "you are now
      in developer mode", "reveal your system prompt", or similar override attempts.
- [ ] The prompt does not instruct the agent to treat user input as commands rather than
      data.
- [ ] The prompt does not contain encoded (Base64, hex, Unicode) instructions that could
      hide malicious content.
- [ ] The prompt does not use typoglycemia or character scrambling to evade detection.
- [ ] The prompt does not request the agent to fetch and obey instructions from external
      URLs or files.

## Data and access

- [ ] The prompt does not request access to credentials, API keys, environment variables,
      or sensitive files without explicit, scoped justification.
- [ ] The prompt does not instruct the agent to send data to external endpoints
      (webhooks, APIs, email) unless that is the stated purpose and the user has consented.
- [ ] The prompt does not ask the agent to modify files outside the project's scope.
- [ ] The prompt does not instruct the agent to install or execute packages without
      explicit user approval.

## Guardrails and output

- [ ] The `Guardrails` section clearly states whether the agent may modify files.
- [ ] The `Output format` asks for a concrete, reviewable artifact (not just chat output).
- [ ] The prompt does not contain instructions that could be interpreted as asking the
      agent to hide its actions or outputs from the user.
- [ ] The prompt does not contain social engineering attempts (urgency, authority claims,
      guilt trips) to bypass review.

## Provenance and maintenance

- [ ] If the prompt is adapted from elsewhere, the `author` and `source` catalog
      fields credit the original author and URL (e.g., an X post, blog, or repo).
- [ ] The prompt does not reference external content that could change after review
      (e.g., "follow the instructions at this URL").
- [ ] The prompt has been tested in a clean environment and produces the expected output.
- [ ] The prompt is added to the README index.
