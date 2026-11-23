## Context

Act as a Senior Product Designer and Frontend Architect specialising in
scalable design systems. You are auditing an existing, already-built
application: the actual pages, component library, stylesheets and frontend
architecture. The application may have many different button styles, several
card styles and slightly different spacing on every page — each component looks
acceptable individually, but together they make the product feel inconsistent.

The rules in **Guardrails** are binding throughout the whole audit.

## Goal

Audit the application's visual consistency, reusable components, design tokens
and UI implementation, then produce a consistency plan that makes the entire
product feel like it belongs together.

## Inputs

This prompt is self-contained — the audit discovers the pages, components,
stylesheets and frontend architecture from the repository itself.

## Instructions

### Step 1 — Map the existing design system

Identify:

- Existing colour palettes and design tokens.
- Typography scale and font usage.
- Spacing and sizing conventions.
- Border, radius and shadow values.
- Button, input and card components.
- Navigation and layout patterns.
- Modal, dropdown and tooltip implementations.
- Reusable page sections and component variants.

Identify styles that are repeated or inconsistent.

### Step 2 — Find UI inconsistencies

Compare similar components across different pages. Check for:

- Buttons with inconsistent heights and padding.
- Different styles for identical actions.
- Inconsistent heading and body text sizes.
- Unnecessary colour variations.
- Different card spacing and border treatments.
- Inconsistent form layouts.
- Misaligned icons and text.
- Different navigation behaviour.
- Repeated components implemented in different ways.

### Step 3 — Audit component quality

- Identify duplicated components.
- Find components with too many unrelated responsibilities.
- Check whether variants are implemented consistently.
- Identify pages that bypass shared components.
- Review whether component props are understandable.
- Find styles that override one another.
- Check for unnecessary CSS complexity.
- Identify components that are difficult to maintain or reuse.

### Step 4 — Review all component states

Check whether interactive components have consistent:

- Default states.
- Hover states.
- Focus states.
- Active states.
- Disabled states.
- Loading states.
- Error states.
- Success states.
- Empty states.

Don't judge components only by the ideal screenshot. Check what happens when
users interact with the product.

### Step 5 — Create a consistency plan

- Recommend a clear set of design tokens.
- Identify components that should become shared components.
- Recommend which duplicate implementations should be consolidated.
- Highlight components that should remain different because their behaviour is
  genuinely different.
- Prioritise improvements by how many pages they affect.
- Avoid introducing unnecessary abstractions.

## Output format

Produce a single markdown document named `DESIGN-SYSTEM-AUDIT.md` unless I say
otherwise, containing:

1. Existing design system inventory.
2. UI inconsistency report with affected pages.
3. Duplicated component report.
4. Recommended design token structure.
5. Shared component improvement plan.
6. Prioritised refactoring roadmap.
7. Visual regression test checklist.

For every recommendation, explain why the change improves consistency and how
many parts of the application it affects.

## Guardrails

- Preserve the existing brand identity.
- Don't suggest a complete redesign just because you prefer another visual
  style.
- Don't replace the design system with generic templates.
- Don't change every component in one large refactor.
- Don't remove useful component variations.
- Don't introduce a new UI library without approval.
- Verify changes across all affected pages.
- Keep existing behaviour working.
- The audit report is the deliverable. Modify repository files only if
  explicitly authorised; if authorised, implement the improvements
  incrementally and verify the affected pages.
- A good design system isn't about making every component look identical — it's
  about making the entire product feel like it belongs together.
