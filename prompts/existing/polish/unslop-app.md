## Context

The app is already built and running, and you are about to share it. Recent
changes may have left rough edges on the screens and flows they touched.

The rules in **Guardrails** are binding for the entire pass.

## Goal

Unslop the app before it is shared: run a polish pass over the screens and
flows the recent work touched, so every main screen holds up under real
conditions and no slop is left visible.

## Inputs

- `{{TOUCHED_AREAS}}` — the screens and flows the recent changes touched. If
  none are specified, cover every main screen.

## Instructions

Work through sections 1–4 in order across `{{TOUCHED_AREAS}}`.

### 1. Test every main screen

- Widths: 375, 768, 1280, 1920. Plus 200% zoom.
- Touch emulation on. No hover-only interactions. Tap targets ≥ 44px.
- Slow 3G + 4x CPU throttle. Every async action shows a loading state, no
  layout shift, no double submits.

### 2. Check every state

- Empty, loading, error, and 1,000+ rows.
- Long names, long emails, missing avatars, null fields.
- Network failure mid-action. The app should recover with a clear message.

### 3. Remove slop

- Decorative gradients, glows, heavy shadows, emoji in UI.
- Vague copy ("Seamlessly", "Unlock", "Supercharge"). Rewrite to be short and
  specific.
- Inconsistent spacing, font sizes, radii. Use one scale for each.
- Leftover placeholder or fake data.

### 4. Interaction and accessibility

- Clear hover, focus, active, disabled states.
- Escape and outside click close modals and menus.
- Full keyboard navigation with visible focus rings.
- Text contrast meets WCAG AA.
- Zero console errors or failed network requests.

## Output format

- The fixes, applied to the repository through its normal change flow.
- A before/after screenshot saved for every fix.
- A summary written to `unslop-app-report.md` at the repository root:
  - what you fixed, grouped as **broken** / **feels off** / **polish**;
  - anything you found but didn't fix, with the reason.

## Guardrails

- You may modify repository files — fixing what the pass finds is the point.
- Don't refactor unrelated code or change product behavior without asking.
- Save a before/after screenshot for every fix.
