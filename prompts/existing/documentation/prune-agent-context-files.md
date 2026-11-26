## Context

This repository is already built and running. Act as a context editor working Matt
Pocock's way. Treat every line in `CLAUDE.md` and every `AGENTS.md` as a cost paid
on every request; a line has to earn its place. The rules in **Guardrails** are
binding.

Adapt these ideas from Matt Pocock's public writing on `CLAUDE.md`:

- Never run `/init`. If a context file was auto-generated, it goes.
- The file loads into the system prompt of every session, so each line takes room
  from exploring, building and testing.
- A model can follow roughly 300 to 400 instructions at once. Irrelevant lines
  spend that budget before the task starts.
- Anything the agent can read in `package.json`, configs, imports or the folder
  tree is a duplicate.
- File and service paths are the worst lines: they go stale and then mislead.
- A study of repository-level context files found they raise inference cost by
  more than 20% on average and do not generally raise task success.
- Steering belongs in skills, loaded only when relevant.
- Keep a line only if it is undiscoverable and globally relevant. Matt's whole
  file is six words.

Sources: Matt Pocock, "Never Run Claude /init"
(https://aihero.dev/never-run-claude-init); Matt Pocock's video "Never Run claude
/init"; Gloaguen et al., "Evaluating AGENTS.md: Are Repository-Level Context Files
Helpful for Coding Agents?" (https://arxiv.org/abs/2602.11988).

## Goal

Cut `CLAUDE.md` and every `AGENTS.md` down to the lines the agent cannot find on
its own and needs in every session. Move the rest into skills or delete it, show
the before/after, and wait for approval before saving anything.

## Inputs

This prompt is self-contained. Run it from the repository root; everything needed
is discovered from the repository and local agent context files.

## Instructions

### Layer 1 — Inventory

Find every context file: `CLAUDE.md`, `AGENTS.md`, nested versions in subfolders,
and `~/.claude/CLAUDE.md`. Number every line. Count lines, words and rough tokens
per file.

### Layer 2 — Discoverable lines

For each line ask: can the agent learn this by reading `package.json`, a config
file, an import or the folder tree? If yes, mark `CUT` and name the file that
already says it.

### Layer 3 — Non-global lines

For each remaining line ask: does this matter in every session — frontend,
backend, docs and database alike? If not, mark `MOVE TO SKILL` and name the skill
it belongs in.

### Layer 4 — Stale paths

Check every file, folder or service the context file names. If it no longer
exists, mark `CUT` as stale. If it exists, still mark `CUT`: the agent can find it
by searching.

### Layer 5 — Skills

Group the `MOVE TO SKILL` lines by topic. Draft one skill per topic with a
one-line description that says when to load it. Never put the same rule in a
skill and in `CLAUDE.md`.

### Layer 6 — Keep

Keep only what passes both tests:

- Non-obvious environment facts, such as the OS, WSL, or a CLI the agent must use
  instead of the default.
- Non-standard practices the code cannot show.

### Layer 7 — Proof

Produce one table with each line, its verdict (`KEEP`, `MOVE` or `CUT`), and the
reason. Then give token counts before and after for every file, and the share of
the old file that survived.

### Start

Run layer 1 now and show the inventory. Then wait for approval before continuing.

## Output format

Produce a single markdown review bundle containing:

1. **Inventory** — every context file found, with line, word and rough token
   counts.
2. **Decision table** — each line, its `KEEP` / `MOVE` / `CUT` verdict, and the
   reason.
3. **Proposed context files** — the new contents of each `CLAUDE.md` and
   `AGENTS.md`.
4. **Drafted skills** — each proposed skill and its one-line load condition.
5. **Token comparison** — before and after for every file, plus the share of the
   old file that survived.
6. **First command** — the one command to run first.

Do not save the bundle or modify repository files until explicitly approved.

## Guardrails

- Change nothing until I say OK.
- Never delete a file: show the new version, and let git keep the old one.
- Do not invent conventions the repository does not have.
- If a line looks important but you cannot tell why, ask me once.
- You may modify repository files only after explicit approval; until then, only
  propose them.
