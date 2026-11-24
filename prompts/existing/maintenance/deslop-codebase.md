## Context

This repository is already built and running. You are doing a one-time cleanup of
its structure with [`deslop-please`](https://github.com/deterministic-machines/deslop-please),
an opinionated linter that flags sloppy code. It follows *A Philosophy of Software
Design*: **deep** modules, **narrow** interfaces. Deep modules hide the attention
for you and your agents, so you only need to care about the narrow interface.

`deslop-please` analyzes Rust workspaces (it installs with `cargo install
deslop-please` and reads `cargo metadata`). It reports four classes of problems:

- `module-cycle` — modules that use each other, even when what they exchange only
  forms a chain.
- `tangle` — a module and its child module know each other, with no module cycle.
- `field-leak` — a type's fields are known and worked on outside the module that
  owns them.
- `shallow-module` — callers use too much of a module's surface instead of a
  narrow interface.

**The rules in the Guardrails section are binding. Read them before starting.**

## Goal

Fix every error `deslop-please` flags, from first principles toward deeper modules
and narrower interfaces, so a final run reports a clean codebase and intended
behavior is unchanged.

## Inputs

This prompt is self-contained: run it from the root of the Rust workspace you want
to deslop. The linter discovers the structure itself; there are no placeholders to
fill in.

## Instructions

1. Install the linter with `cargo install deslop-please`, then run `deslop-please`
   from the repository root. Record the full list of errors before changing
   anything.
2. Work out the fix for each error using the per-class questions in Guardrails.
   Draw a diagram to help the user understand the before and proposed after
   structure.
3. Land the fixes through the repository's normal change flow (commits or PRs
   matching its conventions).
4. Re-run `deslop-please` and repeat until it reports no errors. If an error truly
   should not be fixed, mute it with
   `deslop-please --update-allow .deslop-please.allow` and run subsequent checks
   with `deslop-please --allow .deslop-please.allow`, and say why in the report.

## Output format

- The deslopped codebase, landed through the repository's normal change flow.
- For each error class you touched, a diagram showing the before and after
  structure.
- A final report listing: the errors found per class, the fix for each, anything
  muted via `.deslop-please.allow` and why, and evidence that intended behavior is
  unchanged (the repository's own build and tests passing).

## Guardrails

These rules are binding throughout the task:

- Errors flagged by `deslop-please` must be fixed from first principles — don't do
  mechanical moves to hide them.
- `module-cycle` & `tangle`: what is the intended layer of abstraction? Which
  module should be at which layer?
- `field-leak` & `shallow-module`: why do we have these fields/functions at all?
  What are the patterns of use? Can they be hidden behind a narrow interface?
  Don't fix each leak one at a time — fix them holistically.
- Draw a diagram to help the user understand the before and proposed after
  structure.
- You may modify repository files; this is a refactor, not an audit.
- Intended behavior must be the same as when you started — verify it with the
  repository's own build and tests at the end.
