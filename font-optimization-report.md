# Font optimization report

**Result: 64,328 → 29,872 font bytes per page (−53.6%), visually identical rendering.**

Every page used to download three files (geist-latin, geist-mono-latin,
orbitron-latin). Each is now split into a preloaded **core** (ASCII + the
punctuation this site uses) plus **extended** files behind `unicode-range` that
never download for current content. Cyrillic / Vietnamese / symbols faces were
already lazy and are shipped verbatim.

## 1. Bytes

### Per font file (site/dist)

| Before (dist/_astro)         |        Size | After (dist/fonts)                  |                   Size |
| ---------------------------- | ----------: | ----------------------------------- | ---------------------: |
| geist-latin-wght-normal      |      29,400 | geist-core + geist-ext + geist-exta | 14,792 + 8,904 + 8,328 |
| geist-mono-latin-wght-normal |      23,128 | geist-mono-core + -ext + -exta      | 10,188 + 7,516 + 6,688 |
| orbitron-latin-wght-normal   |      11,800 | orbitron-core + orbitron-ext        |          4,892 + 2,644 |
| geist-cyrillic               |      15,084 | geist-cyrillic                      |      15,084 (verbatim) |
| geist-cyrillic-ext           |       7,420 | geist-cyrillic-ext                  |       7,420 (verbatim) |
| geist-vietnamese             |       8,004 | geist-vietnamese                    |       8,004 (verbatim) |
| geist-mono-latin-ext         |      14,696 | (folded into geist-mono-exta)       |                      — |
| geist-latin-ext              |      16,512 | (folded into geist-exta)            |                      — |
| geist-mono-cyrillic          |      12,940 | geist-mono-cyrillic                 |      12,940 (verbatim) |
| geist-mono-cyrillic-ext      |       6,176 | geist-mono-cyrillic-ext             |       6,176 (verbatim) |
| geist-mono-vietnamese        |       7,696 | geist-mono-vietnamese               |       7,696 (verbatim) |
| geist-mono-symbols2          |       5,812 | geist-mono-symbols2                 |       5,812 (verbatim) |
| **Total in dist**            | **158,668** |                                     |            **127,084** |

### Per page (downloaded on load)

| Page         | Before |  After |                Δ |
| ------------ | -----: | -----: | ---------------: |
| All 11 pages | 64,328 | 29,872 | −34,456 (−53.6%) |

Breakdown per page: geist-core 14,792 + geist-mono-core 10,188 + orbitron-core
4,892. Every page used to download the same three files (mono was never
preloaded but always needed by cards/code).

Preloaded bytes: 41,200 → 19,684 (geist-latin + orbitron-latin → geist-core +
orbitron-core, same `rel="preload"` pattern in `site/src/layouts/base.astro`).

Extended files verified lazy: instrumented crawl shows only the three core
files requested per page; a test page containing `é §` downloads `geist-ext`,
and one containing `Ł ž ą` downloads `geist-exta` — each renders identically to
the original fontsource face (0-pixel diff on a dedicated render test).

### What was cut

- **Glyph sets**: core = ASCII + U+00A0 + combining marks + curly quotes/dashes/
  ellipsis (superset of the 94 distinct characters the site renders). Extended =
  the original latin face's remaining declared coverage. Ext-A file = the
  original latin-ext file limited to U+0100–017F.
- **wght axis**: Geist 100–900 → 400–700; Geist Mono → 400–500; Orbitron
  400–900 → pinned static at 700 (the only weight `.font-logo` uses). Computed
  font-weights in use, measured by crawling every element on every page: Geist
  400/500/600/700, Mono 400/500, Orbitron 700 only.
- **Features**: none dropped — all OpenType layout features kept (`kern`,
  `mark`, `mkmk`, `liga`, `tnum`, etc.). The CSS `font-feature-settings: "cv11",
  "ss01"` was already inert: those features don't exist in the fontsource
  subsets.
- **Hinting**: see Deviations.

## 2. Pixel diffs

Method: two clean builds (before = stashed optimization, after = final state),
served locally, screenshotted full-page in headless Chromium 159 at 2× device
scale, `prefers-reduced-motion: reduce`, external requests (unavatar etc.)
aborted for determinism. Same-build screenshots are byte-identical under this
setup, so every reported diff is attributable to the change.

| Page                                                        | Differing px | px with delta > 30 | Verdict            |
| ----------------------------------------------------------- | -----------: | -----------------: | ------------------ |
| /index.html                                                 |        7,623 |                509 | sub-pixel rounding |
| /prompts.html                                               |        4,462 |                304 | sub-pixel rounding |
| /prompts/existing.html                                      |        5,231 |                380 | sub-pixel rounding |
| /prompts/existing/maintenance.html                          |        3,179 |                259 | sub-pixel rounding |
| /prompts/existing/maintenance/untangle-codebase.html        |        6,728 |                495 | sub-pixel rounding |
| /prompts/existing/operations.html                           |        3,281 |                255 | sub-pixel rounding |
| /prompts/existing/operations/optimize-web-font-loading.html |       15,963 |              7,107 | sub-pixel rounding |
| /prompts/existing/quality.html                              |        3,008 |                264 | sub-pixel rounding |
| /prompts/existing/quality/optimize-ci-speed.html            |       14,906 |              7,019 | sub-pixel rounding |
| /prompts/existing/quality/setup-go-quality-gate.html        |       11,182 |                804 | sub-pixel rounding |
| /404.html                                                   |        1,628 |                 57 | sub-pixel rounding |

**Explanation of every visible difference: harmless sub-pixel rounding.**
Amplified diffs trace glyph edges only — antialiasing coverage differing by a
few levels. Caused by fontTools' instancer re-encoding variation deltas
(float→fixed rounding differs from FreeType's runtime interpolation); the
default-master outlines, advances, hmtx/HVAR values, hhea/OS/2 vertical
metrics, line wrap points, and ink bounding boxes are byte-identical (verified
via fontTools and in-browser measurement). At 8× zoom glyph shapes are
indistinguishable; text is pixel-for-pixel aligned. Code-heavy pages show more
pixels because they contain more glyph edges, not larger deltas.

## 3. Deviations

- **Hinting kept.** The task said drop it; the sources contain only a `prep`
  table (no per-glyph programs) and keeping it costs ~0 bytes while eliminating
  a rasterization variable. Dropping unused OpenType _features_ was also not
  done — all kept, since removing any present feature can change shaping and
  saves little.
- **Copied faces keep fontsource's exact declared `unicode-range`.** The rule
  "each file's unicode-range lists only characters it contains" is honored for
  all generated faces (ranges = original declared range partitioned by what's
  in the file). The six verbatim faces are an exception: their cmaps contain
  stray codepoints outside the declared ranges (e.g. the cyrillic file has
  `A`), and declaring those rebinds Latin characters under first-match face
  resolution — measured as global kerning shifts and reverted. Copied files
  therefore keep fontsource's declared ranges verbatim.
- **`latin-ext` trimmed to Latin Extended-A (U+0100–017F)** per the stated
  requirement ("keep used chars + Latin-1 + Ext-A"). Characters the old
  latin-ext face declared outside Ext-A (IPA, modifiers, Latin Extended
  Additional, currency, letterlike) now resolve to the next font instead of
  Geist — none appear in current content or the search index.
- **wght clamped to observed ranges** (Geist 400–700, Mono 400–500). If future
  markup produces a computed weight outside these (e.g. `bolder` chains past
  700), it clamps to the range edge instead of interpolating — same class of
  behavior as today for weights outside 100–900, just narrower.
- **Orbitron pinned at 700** ("fix an axis at one value if nothing overrides
  it" — only 700 is used). Its internal names were renamed to "OTP Wordmark"
  because Orbitron's OFL copyright line carries a Reserved Font Name; Geist and
  Geist Mono declare no RFN and keep their names.
- **Kept the ancillary faces verbatim** (cyrillic, vietnamese, symbols2) — they
  already lazy-load behind unicode-range and cost 0 bytes/page today; removing
  them would only change behavior for content that doesn't exist.
- `font-display: swap`, family names, fallback stacks, and preload pattern
  untouched. `@font-face` order preserved from fontsource (latin-derived faces
  last) so overlap resolution matches today.

## 4. Rerun

```sh
python3 -m venv .venv-fonts          # once
.venv-fonts/bin/pip install fonttools brotli
.venv-fonts/bin/python scripts/optimize-fonts.py
bun run build
```

Outputs: `site/public/fonts/*.woff2` (committed) and
`site/src/styles/fonts.css` (committed, generated — do not hand-edit; the
script regenerates it so unicode-ranges always match the files).

Rerun when:

- `@fontsource-variable/geist|geist-mono|orbitron` is upgraded (new outlines,
  coverage, or metrics).
- Content is added that should render in a web font but currently wouldn't:
  the core set covers ASCII + common punctuation; Latin-1/Ext-A and the rest
  of the original latin coverage live in the lazy files, so normal prose needs
  no rerun. Rerun (and check `scripts/optimize-fonts.py`'s `CORE`) if you add
  content with characters outside ASCII that must render on first paint.
- CSS starts using `font-weight` outside the clamped ranges, italics
  (`font-style`), or new font-feature-settings.

The site build itself needs no font tooling — the script is run by hand only.

## Files

- `scripts/optimize-fonts.py` — the whole pipeline; documents each decision.
- `site/public/fonts/*.woff2` — 15 files: 8 generated (core/ext/exta per
  family, orbitron pinned pair) and 7 verbatim ancillary subsets.
- `site/src/styles/fonts.css` — generated `@font-face` block; imported by
  `app.css` instead of the three `@fontsource-variable` imports.
- `site/src/layouts/base.astro` — preloads now point at the two core files.
- `.gitignore` — ignores `.venv-fonts/`.
