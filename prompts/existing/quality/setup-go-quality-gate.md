---
id: setup-go-quality-gate
title: Set Up a Self-Improving Quality Gate for a Go Repository
phase: existing
purpose: quality
one_time: true
tags: [go, quality, ci, linting, agents]
---

# Set Up a Self-Improving Quality Gate for a Go Repository

> **When to use:** Once per Go repository, when the code is already built and you want an
> automated gate that blocks sloppy, AI-generated Go code and gets stricter over time.

## Context

You are setting up an automated gate that blocks sloppy, AI-generated Go code. This is a
ONE-TIME setup task. The repository already exists and builds; nothing has been gated yet.

**The ground rules in the Guardrails section are binding. Read them before starting.**

Work in the phases below, in order. Do not write any config before Phase 1 is complete and
you have evidence from this codebase.

## Goal

Produce a working quality gate — enforced both locally for agents and in CI for everyone —
plus a self-improving `AGENTS.md`, and a final report documenting what was set up.

## Inputs

This prompt is self-contained: it discovers everything it needs from the repository itself
(`go.mod`, git history, existing CI and build tooling). No placeholders to fill in — run
it from the repo root of the Go project you want to gate.

## Instructions

### Phase 1: Discover the codebase

Write `docs/quality-discovery.md` covering:

1. **Stack**: Go version (`go.mod`, toolchain), module layout (single or multi-module, `go.work`), frameworks (HTTP, gRPC, ORM, DI), build/test/CI tooling, generated code locations (protobuf, mocks, sqlc, ent) which must be excluded from linting.
2. **Existing tooling**: current `.golangci.yml`, Makefile targets, CI workflows, git hooks, and any `AGENTS.md`, `CLAUDE.md`, or contributing docs. Extend them. Do not fight them.
3. **Current baseline**, measured BEFORE changing anything: `go build ./...`, `go vet ./...`, `go test ./...` (pass/fail, duration), existing lint results, current test coverage.
4. **Real conventions, with evidence from the code**:
   - Error handling: wrapping style (`%w`), sentinel and typed errors, where errors are logged vs returned
   - Logging library and context propagation (`context.Context` first param, usage rules)
   - Package layout and import layering (which packages may import which)
   - Concurrency patterns (errgroup, worker pools, channels) and lifecycle handling
   - Test style (table-driven, testify vs stdlib, fakes vs mocks, `t.Parallel` use, fixtures, build tags)
   - Approved internal helpers and libraries that should be reused instead of reimplemented
5. **History mining**: from `git log`, find commits matching fix, revert, hotfix, workaround, hack, temp, and recurring review feedback. Classify the recurring bug classes and sloppy patterns, and mark which ones a tool could catch automatically.
6. **Measure the current state** so thresholds are calibrated:
   - Counts of: `//nolint`, `t.Skip`, `_ =` and `_, _ :=` ignoring errors, empty `if err != nil {}` blocks, `panic(`, `time.Sleep`, `fmt.Print*`, `TODO|FIXME|HACK|XXX`, `interface{}`/`any` in non-generic code, package-level vars, `init()` functions, bare `go func()`
   - Function length, cyclomatic and cognitive complexity, parameter count, nesting depth: p50, p90, p99
   - Duplication percentage and the top duplicated blocks
   - Dead code (`deadcode`, `unused`)
   - Test coverage per package, and how many packages have no tests

Output a table: **signal -> current measurement -> proposed threshold -> reason**.

### Phase 2: Design the rules from the evidence

Principles:

- Thresholds come from the measured distribution of the healthy part of the codebase, not textbook defaults. Justify each in a comment.
- Prefer rules that target what this repo's history shows going wrong.
- Every enabled rule needs a one-line reason. Every rule you consciously leave off (noisy, conflicts with conventions) goes in the report with a reason.

#### golangci-lint (v2 config format)

Check `golangci-lint linters` for what exists in the installed version. Start from `default: none` and enable explicitly. Candidates, to be tuned from Phase 1:

- **Correctness**: govet, staticcheck, errcheck (`check-blank: true`, `check-type-assertions: true`), errorlint, nilerr, ineffassign, copyloopvar, exhaustive
- **Error and context hygiene**: wrapcheck, contextcheck, noctx, bodyclose, rowserrcheck, sqlclosecheck
- **Workaround detectors**: nolintlint (`require-explanation`, `require-specific`, `allow-unused: false`), godox (TODO, FIXME, HACK, XXX, WORKAROUND), forbidigo (ban `time.Sleep`, `fmt.Print*`, `panic`, and repo-specific bans such as reimplementations of approved helpers), gochecknoglobals, gochecknoinits, nakedret
- **Complexity and duplication**: gocognit, cyclop, funlen, nestif, dupl, goconst, mnd
- **Dead code**: unused, unparam
- **Performance**: prealloc, perfsprint, gocritic (diagnostic, performance, style tags)
- **Security**: gosec
- **Tests**: testifylint (if testify is used), thelper, tparallel
- **Architecture**: depguard or equivalent, encoding the import layering found in Phase 1

Also: set `max-issues-per-linter: 0` and `max-same-issues: 0`, exclude generated code, and run `golangci-lint config verify`.

#### Go toolchain checks

- `go vet ./...`
- `go test -race -shuffle=on -count=1 ./...`
- `govulncheck ./...`
- `go mod tidy` drift check (`git diff --exit-code go.mod go.sum`)
- `deadcode` for unreachable functions
- `goleak` in `TestMain` for packages that start goroutines (add it only where it passes on current code, or baseline the rest)
- Benchmarks for existing hot paths compared with `benchstat` in CI, non-blocking at first

#### Semgrep for repo-specific slop

Write `.semgrep/slop.yml`, derived from Phase 1 history and measurements. Starting candidates:

- error assigned to `_`
- empty `if err != nil {}` block
- bare `go func() { ... }()` without errgroup or context lifecycle
- reimplementation of an approved internal helper
- context created with `context.Background()` or `TODO()` inside a request path

Each rule's `message` must tell the agent what to do instead. Add a positive and a negative fixture per rule in `.semgrep/tests/` and make sure `semgrep --test` passes.

#### Duplication and tests

- jscpd (or equivalent) for cross-file duplication with a threshold calibrated to the current baseline, ratcheting down over time
- Coverage on **changed lines** (diff-cover or equivalent) with a threshold calibrated to current coverage
- Mutation testing (gremlins or go-mutesting) on the few most critical packages only, as a scheduled non-blocking job

#### Diff-level checks

Write `scripts/quality/diff-check` (any language the repo already uses). It runs on the PR diff and fails when the diff:

- adds `//nolint`, `t.Skip(`, or `//go:build ignore`
- removes test assertions or deletes test files without replacement
- edits gate config, `.semgrep/`, `scripts/quality/`, CI workflows, or coverage thresholds without CODEOWNERS approval
- changes `go.mod` without a justification line in the PR description
- exceeds a size cap you choose from the repo's typical PR size

#### CODEOWNERS

Require owner review on: `.golangci.yml`, `.semgrep/`, `scripts/quality/`, CI workflows, coverage config, and `AGENTS.md`. This stops the agent from weakening the gate to get past it.

### Phase 3: Baseline strategy (do not skip)

Strict rules will flag a lot of existing code. Handle it like this:

1. Gate **new and changed code strictly** (golangci-lint `new-from-rev` against the main branch, and changed-files mode for Semgrep and the diff checks).
2. Record existing debt as counts per rule in `docs/quality-baseline.md` (or a machine-readable file).
3. Add a **ratchet** in CI: per-rule totals may go down, never up.
4. Fix only mechanical, safe, auto-fixable violations now, in a separate commit. Do not do large refactors here.
5. Recommend a payoff order for the remaining debt, by risk first.

### Phase 4: One command, two enforcement points

1. Create a single entry point (`make gate` or the repo's equivalent) that runs, fail-fast and cheapest-first: build, golangci-lint, vet, Semgrep, test with race and shuffle, diff checks, coverage on changed lines, duplication, govulncheck, mod tidy drift. Output must be agent-readable: file:line, rule id, and a fix hint.
2. **For the agent**: add a hook so it cannot declare work done while the gate fails. For Claude Code, that means a `Stop` hook running the gate and exiting with code 2 on failure with errors on stderr, which blocks the agent and feeds the errors back. Check the current hooks docs for the exact config. Add a loop guard so repeated failures escalate to a human instead of looping forever. For other agents, use their equivalent, and say which you used.
3. **For everyone**: run the same entry point in CI as a **required status check**, with branch protection, no admin bypass, and required human review. Note that local hooks can be skipped with `--no-verify`, so CI is the real gate.

### Phase 5: Make AGENTS.md self-improving

Create or update `AGENTS.md` (and make `CLAUDE.md` point to it if the repo uses one). It must contain:

1. **Commands**: how to build, test, run the gate, and run a single linter.
2. **Gate rules**: "Never bypass the gate. Never add `//nolint`, `t.Skip`, or disable a rule to make it pass. Never edit gate config to loosen it. If a rule seems wrong, stop and ask a human."
3. **Project conventions** found in Phase 1 (error handling, logging, context, layering, testing, approved helpers), each stated as a short imperative rule with an example path from the repo.
4. **The root-cause rule**, verbatim:

> ### Root-cause fixes must leave a guardrail
> Whenever you fix a bug or defect by finding its root cause, you MUST also add a rule that prevents the same class of problem from recurring, in the same PR. Do this in order of preference:
> 1. **Mechanical enforcement**: a new or tightened golangci-lint setting, a Semgrep rule (with positive and negative fixtures), a forbidigo/depguard entry, or a regression test that fails without the fix.
> 2. **A written rule** in the "Learned rules" section below, when it cannot be enforced mechanically.
>
> Every entry in "Learned rules" must follow this format, be specific and testable, and be checked for duplicates first (merge with or sharpen an existing rule instead of adding near-copies):
> - **Rule**: one imperative sentence.
> - **Why**: the incident or bug that caused it (PR, commit, or issue link).
> - **Enforced by**: the lint rule, Semgrep id, or test name, or "manual" if none.
>
> A fix PR that adds no rule must say why in its description (for example, "one-off typo, no recurring class"). Do not add vague rules like "be careful with errors". If a rule can't be made specific enough to check, don't add it.

5. **A "Learned rules" section**, initially seeded from Phase 1 history mining, each entry in the format above.
6. **Maintenance**: when a learned rule becomes mechanically enforced, update its "Enforced by". Prune rules that no longer apply. Keep the file short and scannable, since long files get ignored. If it grows past about 200 lines, move older detail into `docs/rules/` and link to it.

Also add a small CI check: PRs whose title or commit message starts with `fix` must either touch `AGENTS.md`, `.golangci.yml`, `.semgrep/`, or add a regression test, or contain a `No-guardrail: <reason>` line in the PR description. Warn at first, then make it blocking once the team trusts it.

### Phase 6: Verify the gate works

Do not trust it until you've seen it fail correctly.

1. Create a throwaway branch with deliberate violations: swallowed error, bare `//nolint`, `time.Sleep`, duplicated block, floating goroutine, skipped test, removed assertion, loosened lint config.
2. Confirm each one is caught by the gate and by the diff checks, with a readable message.
3. Confirm the agent hook blocks completion on failure.
4. Confirm a clean change passes and the gate runtime is acceptable. Report timings per step, and move slow steps to CI-only or scheduled runs if needed.
5. Delete the throwaway branch.

## Output format

Deliver a concise report with:

- What was set up, per phase, with commit references
- The signal -> measurement -> threshold -> reason table
- Rules enabled, and rules deliberately left off, with reasons
- The debt baseline per rule and a recommended payoff order
- New dependencies and tools, each with a justification
- Gate runtime breakdown
- Known gaps (things this gate cannot catch, such as design quality and subtly wrong fixes) and what still needs human review
- Open questions that need a human decision

Stop after the report. Do not start paying down debt or refactoring application code.

## Guardrails

These are the ground rules — binding throughout the whole task:

- Never loosen, disable, or bypass a check to make it pass. Fix the code, or record the violation in the baseline (Phase 3) with an explanation.
- Verify every linter name, setting key, and flag against the installed versions (`golangci-lint linters`, `golangci-lint config verify`, `--help`, docs) before using it. Names change between versions. Never guess.
- Use the repo's existing build system (Makefile, Taskfile, mage, etc.) and CI. Do not add a second one.
- Commit per phase with clear messages. Keep each commit reviewable.
- Do not add dependencies or tools without listing each with a justification in the final report.
- Do not refactor application code beyond mechanical, safe, auto-fixable changes. Debt goes in the baseline.
- If something is ambiguous, choose the conservative option, note it in the report, and continue.
