## Context

The app is already built and running. Its HTML and CSS are competent, but the
interface feels off: everything centered, one spacing value used everywhere, a
primary color leaning indigo or purple, every action rendered as a filled
button, no empty states. Nothing errors out — the problem is that generation is
local while design has to be judged globally.

What fixes this is a rulebook, not taste. This prompt applies the rules from
*Refactoring UI* (Adam Wathan & Steve Schoger): symptom → mechanism → specific
fix → concrete number. Every finding in the report must cite a rule — a finding
that cannot name the rule it violates is an opinion, and it gets dropped. The
invariants in **Guardrails** are binding for the entire pass.

## Goal

Run one diagnostic pass over the UI: detect the stack, render the screens,
sweep seven lenses in their fixed causal order, produce a severity-ranked
findings report where every item cites a rule, apply the fixes in the same
order, and re-verify with screenshots.

## Inputs

- `{{UI_SCOPE}}` — the screens, routes, or components to cover. If none are
  specified, cover every user-facing screen.

## Instructions

Work through the phases in order.

### Phase 0 — Detect the stack

Never make a design judgment before this step. Detect and state briefly:

- Framework (React/Vue/Svelte/plain HTML; SSR or SPA).
- Whether the project uses Tailwind, and which major version — `@theme` in CSS
  means v4; `@tailwind base` or `tailwind.config.js` means v3.
- Existing design tokens — CSS custom properties, a theme object, a
  `tokens.json`, a `theme/` directory.
- Component library — shadcn/ui, MUI, Ant Design, Chakra, Radix. These carry
  their own token contracts.
- Dark mode — present, planned, or absent.

An existing design system always wins. Where one exists, translate the rules
into that system's vocabulary; where none exists, that gap is itself a finding.
Never overwrite, never silently migrate, never add a styling dependency.

### Phase 1 — Establish what "correct" means here

Before the sweep, answer:

- Which of the **12 systems** exist and which are improvised: font size, font
  weight, line height, color, margin, padding, width, height, box shadow,
  border radius, border width, opacity. Missing systems are the
  highest-leverage findings — twelve off-scale spacing values is one finding:
  there is no spacing scale.
- What is this surface for? A dense dashboard and a marketing page have
  different correct answers on spacing.

### Phase 2 — Render and look

Reading source is not a design review. When the project can run:

1. Start the preview server and open each screen in `{{UI_SCOPE}}`.
2. Screenshot at desktop (1280px) and mobile (375px) — and dark mode if the
   app supports it.
3. Judge from the pixels: actual measure, actual contrast, actual group
   spacing, whether breakpoints collapse.

Mark every finding that came only from reading code as `code-only` — reduced
confidence, stated honestly.

### Phase 3 — Sweep the seven lenses

Sweep order is fixed and causal, not conventional:
`hierarchy → layout & spacing → typography → color → depth → images →
finishing touches`. Hierarchy problems change what counts as a spacing
problem; spacing changes what counts as a border problem; color must settle
before depth because most depth techniques are color decisions in disguise;
finishing touches are meaningless on a broken structure. Auditing out of order
produces findings that later findings invalidate.

**Hierarchy**

- Can you name the single most important element on the screen? If not,
  hierarchy has collapsed.
- More than three text colors, or more than two font weights? Any weight
  below 400 in UI text?
- Grey text on a colored background, or white-at-reduced-opacity text?
- An element accumulating emphasis treatments while a competitor keeps its
  own? De-emphasize what competes instead of shouting louder.
- `label: value` pairs that could be dropped, merged, or demoted?
- Heading sizes inherited from the tag rather than chosen from the rank?
- Icons at the same color as adjacent text; faint borders darkened instead of
  thickened?
- How many primary-looking actions on the page? More than one is a finding.
  Is a destructive action styled by severity rather than rank?

**Layout & spacing**

- Cramped relative to its content volume? Spacing should start too loose and
  be removed down, not added up from tight.
- Off-scale values — arbitrary-value utilities, odd pixel numbers?
- Does the spacing scale pass the 25% adjacency test (no two steps closer
  than 25%)?
- Content stretched to fill the viewport rather than sized to itself? Was the
  mobile layout designed, or derived by collapsing desktop?
- Fixed-size elements (sidebars, icons, cards) given percentage widths;
  elements wider at a smaller breakpoint; large elements shrinking faster
  than small ones?
- For every spacing-grouped set — forms, headings, lists, horizontal groups —
  is outer spacing greater than inner?

**Typography**

- How many distinct font sizes? All on the scale?
- Measure every paragraph: within 45–75 characters? Paragraphs constrained
  independently of a wider content area?
- Mixed font sizes on one line — baseline-aligned or center-aligned?
- Line-height uniform across sizes and widths? Large headings still carrying
  body-text line-height?
- Centered text longer than two or three lines? Numeric table columns
  right-aligned? Justified text without hyphenation?
- Uppercase text without added letter-spacing?

**Color**

- Palette authored in HSL, or in opaque hex? Values transcribed from an HSB
  picker without conversion?
- Are there 8–10 greys? Does the primary have 5–10 shades, or only one? Do
  semantic states have proper ramps, or improvised colors?
- `lighten()`/`darken()`/`color-mix()` at the point of use?
- Does saturation rise toward both ends of every ramp? Do yellow/orange/lime
  ramps go brown when darkened?
- Measure every text/background pair: 4.5:1 for normal text, 3:1 for large.
  Dark saturated blocks that outweigh the primary action?
- Any information conveyed by color alone?

**Depth**

- Light consistently from above — every shadow with a positive Y and zero X
  offset?
- Raised elements show a light top edge and a shadow below; inputs and wells
  are inset (shadow at top, light at bottom)?
- Shadows drawn from a defined set of five, or written per component? Does
  shadow size track intended z-position — buttons small, dropdowns medium,
  modals large? Do buttons have a pressed state?
- In flat or dark interfaces, is depth carried by color relationships? Any
  blurred shadows in an otherwise flat design?

**Images**

Skip only after confirming there is no imagery — icons and avatars count.

- Text over an image readable across the whole image? Is an overlay doing the
  minimum needed? Any text shadow with a non-zero offset?
- Small icons displayed at 3–4× their drawn size? Screenshots shrunk to
  illegibility? A favicon that is a shrunken full logo?
- User-uploaded images constrained in fixed containers? White-background
  uploads that can bleed into the surface behind them?

**Finishing touches**

Run only after hierarchy, spacing and typography findings are resolved.

- List bullets, quote marks, links and form controls still browser defaults?
- A bland card, alert or nav item that an accent border would give identity?
- Any background variation on a long page? Gradients staying within ~30° of
  hue?
- Does every content-dependent view have a designed empty state — and is
  supporting UI hidden rather than disabled? A missing empty state is P0: it
  is the one state every user is guaranteed to see.
- Count the borders. Could any be a shadow, a background change, or more
  space? Anything carrying a border *and* a shadow *and* a background change?
- Components rendered exactly as their library ships them?

### Phase 4 — Rank and cut

Every finding uses this schema:

`| # | Lens | Sev | Location | Rule | Now | Proposed | Effort | Verified |`

- **Lens** — one of the seven. **Severity** — P0 usability (hierarchy
  collapsed, contrast fails WCAG, color conveys information alone, text over
  image unreadable, ambiguous group spacing that could cause a data-entry
  error, measure far outside 45–75, a destructive action styled as primary,
  layout broken at a supported viewport, missing empty state); P1 consistency
  (off-system values, unranked actions, grey on color, per-component shadows);
  P2 polish (browser defaults, unexploited depth, excess borders,
  library-default components).
- **Rule** — the specific rule it violates. No rule means the finding is
  taste; drop it.
- **Effort** — S (one-line), M (one component), L (systemic or
  cross-cutting). **Verified** — `rendered` or `code-only`.

Then: sort by severity, then effort ascending. Merge duplicates — one root
cause reported through five symptoms is one finding with five locations. Cut
anything you cannot state a failure scenario for. If the list exceeds ~15
items, you are reporting symptoms rather than causes — look for the systemic
finding underneath. **Report P0 findings even when they sit outside
`{{UI_SCOPE}}`.**

### Phase 5 — Fix in sweep order

- Apply fixes in the same lens order — structural fixes first, because they
  frequently dissolve the cosmetic complaints. Adding white space often
  removes the question of whether a border was needed.
- Each change cites its rule and lands as a reviewable diff.
- Never rewrite a component wholesale because it "feels off."
- Re-render the screens and re-screenshot at both widths after fixing.

## Output format

- A report written to `refactor-ui-report.md` at the repository root:
  - a header line: stack detected, Tailwind version, design system or "none
    detected", and how findings were verified (rendered at 1280/375, or
    code-only);
  - findings tables grouped by severity — P0, P1, P2 — most severe first;
  - a **Systemic** section: findings that are missing systems rather than
    individual defects. This is where the report earns its value — the
    difference between a task list and a diagnosis;
  - what was fixed, what was found but not fixed, and why.
- The fixes, applied to the repository through its normal change flow.
- Before/after screenshots for each fixed screen, saved under
  `refactor-ui-report/` or the repo's existing screenshot location.

## Guardrails

These invariants are binding — apply them to your own output as well as the
code you change:

- Make importance visible: one primary action per page, a couple of
  secondary, a few tertiary; a destructive action is not automatically loud.
- Two font weights (400/500 and 600/700) and at most three text colors carry
  almost all UI hierarchy; never below 400 for UI text.
- Every value comes from a defined system — font sizes, spacing, colors,
  shadows, radii, border widths. No hand-tuned one-offs.
- Start with too much white space and remove it.
- Space around a group must exceed space within it.
- Never put grey text on a colored background — hand-pick a color at the
  background's hue with adjusted saturation and lightness; not
  white-at-lower-opacity.
- Choose elements semantically, style them hierarchically — an `h1` is a
  document-structure decision, not a font-size decision.
- Light comes from above: raised gets a light top edge and a small sharp
  shadow below, inset gets a shadow at top; five elevation levels.
- Text measures 45–75 characters; line-height rises with line length and
  falls as font size grows.
- Never rely on color alone — color supports a signal the design already
  carries another way.
- Text contrast: 4.5:1 normal, 3:1 large.
- An existing design system outranks the rulebook on any conflict; surface
  the conflict, follow the system until told otherwise.
- Never install a dependency, never migrate a styling approach, never
  introduce Tailwind into a project that doesn't use it — recommend, and let
  the user decide.
- Don't manufacture a diff to demonstrate a rule was applied — if the
  implementation already satisfies it, say so and move on.
- Don't change product behavior, copy meaning, or functionality — this pass
  changes how the UI looks, not what it does.
- Change only what falls inside `{{UI_SCOPE}}`; report the rest.
- If `{{UI_SCOPE}}` can't be determined and no user-facing screens are
  discoverable, stop and ask instead of guessing.
