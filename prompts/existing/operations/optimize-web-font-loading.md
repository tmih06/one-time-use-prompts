## Context

This is a live site that already renders correctly. You are optimizing its web fonts:
shrink font bytes as far as possible while keeping rendering identical. This is a
ONE-TIME optimization task.

**The rules in the Guardrails section outrank byte savings. Read them before
starting.**

## Goal

Every page loads fewer font bytes and renders pixel-identically to before, proven with
before/after pixel diffs.

## Inputs

This prompt is self-contained: it discovers everything it needs from the repository —
font files, stylesheets, component styles, content and build setup.

## Instructions

### Measure the current state

For each font file: size, glyph count, variable axes, OpenType features and hinting.
Per page: font bytes loaded and what each page preloads.

### Find out what the site actually uses

Check inline component styles as well as stylesheets:

- Which characters appear in the content.
- Which axis values and weights each font needs — including one-off overrides and
  bold inside italics.
- Which OpenType features are turned on.
- CSS side effects, like `hyphens: auto` using the U+2010 hyphen.

### Cut each font down to that usage

- Keep the used characters plus Latin-1 and Latin Extended-A. Leave CJK to system
  fonts if that is how it renders today.
- Limit variable axes to the ranges in use. Only fix an axis at one value if nothing
  overrides it.
- Drop unused OpenType features and hinting.

### Split each font into two files

- A small core with ASCII and the punctuation most pages use (curly quotes, dashes,
  ellipsis), which gets preloaded.
- An extended file behind `unicode-range` that only downloads when a page needs one
  of its characters.
- Each file's `unicode-range` lists only characters it actually contains.

### Watch out for these

- A generated fallback face between the core and extended files will draw the
  extended characters before the real font does.
- Fonts with a Reserved Font Name under the OFL must be renamed internally once
  subset.
- Check the generated files — font tools have quirks.

### Verify before calling it done

- Build a baseline from the same content and pixel-diff before and after on pages
  with code, italics, accented characters, components with their own font settings,
  and CJK.
- Explain every visible difference: content change, regression to fix, or harmless
  sub-pixel rounding.
- Re-measure bytes per page and confirm the extended files only load where needed.

## Output format

Write a report file named `font-optimization-report.md` covering:

1. **Bytes** — before and after per font and per page.
2. **Pixel diffs** — results per tested page, with every visible difference explained
   as content change, regression, or harmless sub-pixel rounding.
3. **Deviations** — anywhere you deviated from what was asked, and what it cost.
4. **Rerun** — how to rerun the script and when it is needed.

## Guardrails

These rules outrank byte savings — binding throughout the whole task:

- Treat any visual change as a regression unless I approve it. If an optimization
  would change rendering, tell me what it saves and what it changes, and keep the
  site looking the same by default.
- Keep the current loading behavior: do not touch `font-display` or fallback fonts.
- Do not add font processing to the build. Write a script I run by hand, commit its
  output, and note when it needs rerunning.
- You may modify repository files (font files, stylesheets, the script) as part of
  this task.
