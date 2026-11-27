## Context

You are setting up a self-optimizing `slow-turn-retro` Stop hook for my coding agents. The environment is already in use: one or more coding agents may be installed, with existing global instructions, hook configuration, and real session transcripts. This is a one-time setup task.

Whenever an interactive turn takes 10+ minutes of active work, the installed system should make the agent diagnose what was slow, ship safe default-path speedups, and log ROI telemetry.

The rules in the Guardrails section are binding throughout the setup and in the retro behavior you install.

## Goal

Install and verify a fast, stdlib-only Python Stop hook for every installed coding agent that supports Stop hooks, together with the standing rule that makes slow turns trigger a high-ROI speedup retrospective.

## Inputs

This prompt is self-contained: discover the installed coding agents, their global instruction files, hook configuration, and recent session transcripts from the environment itself. There are no placeholders to replace.

## Instructions

### 1. Inspect my setup first

- Detect which coding agents I have installed that support Stop hooks, such as Claude Code, Codex, Antigravity, and similar tools.
- Locate my global instructions file and hook configuration for each supported agent.
- Read 2–3 real recent session transcripts per tool to confirm each tool's exact JSONL/event schema before writing any parser.

### 2. Add the standing rule

Add this concise rule to my global instructions:

> Slowness is a bug. Diagnose why something is slow instead of waiting it out. After any interactive turn taking 10+ minutes of active time (enforced by the `slow-turn-retro` Stop hook), check whether it could have run meaningfully faster without losing accuracy, verification, or scope; if so, fix the default path right then and record reusable findings.

### 3. Build and register the Stop hook

Build and register one fast, stdlib-only Python Stop hook. It must run in under 100 ms per Stop and fail open on errors.

#### Accurate active-time accounting

- Measure active time from the latest real user prompt to now, ignoring queued continuation noise, system reminders, and mid-turn hook injections.
- Subtract passive waits: user prompts/approvals, timers/`sleep`, idle subagent/message waits, and external CI/log/chat watchers such as `gh run watch`, `gh pr checks --watch`, and `--follow` tailers.
- Match watchers against the full raw shell command at command position, not truncated summaries or quoted text/heredocs.
- Merge overlapping wait intervals before subtracting them so parallel watches are not double-counted.
- Exclude local file I/O tools (`read`/`edit`/`write`) from `slow_tools` so harnesses that stream parallel edit arguments do not falsely inflate tool duration.
- Break down remaining active time into tool calls, model thinking, and the top 3 slowest tools taking at least 15 seconds.

#### Four skip gates

Implement all four skip gates. Log every fire, skip, and completion to a local JSONL file so ROI can be audited:

1. Active time is under 600 seconds (10 minutes).
2. The run is non-interactive: a subagent, headless/automated run, or non-user-initiated turn.
3. The turn is thinking-only: the slowest non-file tool call is under 30 seconds and timer/`sleep` wait is under 60 seconds. This keeps detached remote/cloud jobs polled via timers while skipping pure-reasoning turns even if the user answered a question mid-turn.
4. Provider latency is the bottleneck: median model-step latency is at least 45 seconds, an upstream inference slowdown the agent cannot fix.

#### Once-per-turn and automatic `retro_s` telemetry

- Track fired turn IDs on disk in a capped FIFO, for example with 400 keys, so each slow turn triggers at most once.
- Evaluate the seen-turn guard before the under-30-second and latency gates. Then, on the closing Stop after a retro finishes — once background tasks and any answer-rescue finish — write a `decision: "complete"` record with wall-clock `retro_s` and `"rescued": true` if answer-rescue ran.

#### Collapsing-UI answer guard

- For any agent UI that hides or collapses the pre-Stop reply once a Stop hook continues the turn, instruct the agent to lead its final message with its complete answer and append a brief `Speedup retro:` note at the bottom.
- On the closing Stop, check content overlap against the pre-Stop reply and block once to rescue the answer if it was dropped.

#### High-ROI retro prompt

Return the retro prompt as the Stop-hook continuation reason, prefixed with the turn's timing breakdown. The retro prompt must instruct the agent to:

- Fix the default path: ship safe, reversible speedups directly in the default execution path — code, CLI default, config, cache, parallel runner, test target, shared helper, or a fast `PreToolUse` guard for recurring slow or hanging shell patterns such as interactive prompts missing `-y` or unfiltered recursive `grep -r` over huge data, cache, or virtual-environment directories.
- Avoid opt-in flags nobody passes and doc-only notes for fixable slowness.
- Only optimize what will run again: prioritize shared tooling and active multi-run pipelines; skip one-off scripts, finished migrations, superseded experiments, and irreducible external waits.
- Timebox with a revert-and-exit rule: keep local speedup passes to about 2–3 minutes, allowing longer only for shared cross-project tooling. If a local optimization hits an unexpected hang, failure, or cascading breakage and is not green within about 3 minutes, revert it and finish instead of burning 10+ minutes debugging mid-retro.
- Verify and close cleanly: verify the speedup, record reusable findings in durable project notes or docs, and finish concisely — or say in one sentence if nothing meaningful could safely be sped up.

### 4. Verify end to end

- Add a `--dry-run` mode that prints `active_s`, `user_wait_s`, `timer_wait_s`, `max_tool_s`, `tool_calls`, `median_step_latency_s`, and the hook decision for any transcript.
- Write unit tests covering active-time math, merged overlapping watch spans, raw-command CI-watcher detection, local-file-tool exclusion, all four skip gates, once-per-turn idempotency, closing `retro_s` logging, and collapsing-UI answer rescue.
- Replay at least 3 real past transcripts per installed tool through `--dry-run` to confirm accuracy.
- Verify hook execution stays under 100 ms.

## Output format

Write a markdown report file named `slow-turn-retro-setup-report.md` in the current working directory unless I say otherwise. Include:

1. **Setup inventory** — detected agents, configuration files, transcripts examined, and any installed agents skipped because they do not support Stop hooks.
2. **Changes made** — the global rule location, hook implementation location, registration changes, telemetry log location, and tests added.
3. **Verification** — unit-test results, dry-run metrics for each replayed transcript, measured hook runtime, and any discrepancies fixed.
4. **Operation** — how the hook decisions are recorded, how to inspect ROI telemetry, and any manual steps needed to complete or reverse the setup.

## Guardrails

- The Stop hook must fail open on errors and stay under 100 ms per Stop.
- Do not lose accuracy, verification, or scope to gain speed.
- Never cut corners on what the user cares about.
- Do not take costly, outward-facing, or risky actions without asking.
- Optimize only what will run again; do not spend retro time on one-off scripts, finished migrations, superseded experiments, or irreducible external waits.
- If a local optimization hits an unexpected hang, failure, or cascading breakage and is not green within about 3 minutes, revert it and finish.
- You may modify user-level agent instruction files, hook configuration, the hook implementation, and its tests as part of this setup. Do not modify unrelated files.
- If critical information is missing, stop and ask instead of guessing.
