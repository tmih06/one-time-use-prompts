#!/usr/bin/env python3
"""Subset the site's web fonts and split each family into core + extended files.

Run by hand (see "Rerun" in font-optimization-report.md):

    python3 -m venv .venv-fonts
    .venv-fonts/bin/pip install fonttools brotli
    .venv-fonts/bin/python scripts/optimize-fonts.py

Inputs:  the @fontsource-variable woff2 files under site/node_modules.
Outputs: site/public/fonts/*.woff2  +  site/src/styles/fonts.css
         (generated @font-face block; app.css @imports it)

Rerun after: dependency bumps of the @fontsource-variable packages, or content
changes that introduce characters outside the core set (the extended files keep
Latin-1 + Latin Extended-A + the punctuation the sources already cover, so most
content changes need no rerun).

Decisions baked in (measured 2025-11-23 against the built site, see report):
- Core set: printable ASCII + U+00A0 + combining marks + curly quotes, en/em
  dash, ellipsis. Preloaded. Covers every character the site renders today.
- Extended set: everything else the fontsource "latin" face *declared*
  (Latin-1 remainder + its symbols/punctuation) — lazy behind unicode-range.
- unicode-range values replicate fontsource's declared coverage, not raw
  cmaps: the subset files contain stray codepoints outside their declared
  ranges (the cyrillic file has 'A'), and declaring them rebinds those chars
  to faces whose kern tables lack Latin pairs — face resolution must stay
  byte-for-byte compatible with today. Copied faces keep their original
  declared ranges verbatim; core/ext/exta partition the original latin and
  latin-ext ranges.
- Latin Extended-A: the fontsource "latin-ext" file subset to U+0100-017F —
  lazy, covers the mandate's Ext-A requirement.
- Cyrillic / Vietnamese / Geist Mono "symbols2" faces: copied untouched — they
  already sit behind unicode-range and never download for current content.
- wght axis: Geist clamped to 400-700, Geist Mono 400-500 (computed styles in
  use today; nothing overrides them), Orbitron pinned at 700 (the only weight
  .font-logo uses). fvar min values are left untouched (400/400/700).
- All OpenType layout features kept: the CSS turns on "cv11"/"ss01" (absent
  from these files — inert) and dropping any present feature could change
  shaping. Hinting kept: dropping it changed rasterization under FreeType
  (autohint shifts advances ~1px) — measured, see report.
- Orbitron has a Reserved Font Name under the OFL: internal names are renamed
  to "OTP Wordmark". Geist/Geist Mono declare no RFN and keep their names.
- font-display: swap and the CSS font-family names are unchanged — rendering
  and loading behavior (except smaller bytes + lazy extended files) is kept.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
NM = ROOT / "site" / "node_modules" / "@fontsource-variable"
OUT_DIR = ROOT / "site" / "public" / "fonts"
CSS_OUT = ROOT / "site" / "src" / "styles" / "fonts.css"

# --- character sets -------------------------------------------------------

ASCII = set(range(0x20, 0x7F))
COMBINING = set(range(0x300, 0x370))  # so a precomposed gap can still decompose
CORE_EXTRA = {0xA0, 0x2018, 0x2019, 0x201C, 0x201D, 0x2013, 0x2014, 0x2026}
CORE = ASCII | COMBINING | CORE_EXTRA
LATIN_EXT_A = set(range(0x100, 0x180))


def cps(ranges: str) -> set[int]:
    """Parse 'U+0020-007E,U+00A0,...' into a set of codepoints."""
    out: set[int] = set()
    for part in ranges.split(","):
        lo, _, hi = part.strip().removeprefix("U+").partition("-")
        out.update(range(int(lo, 16), int(hi, 16) + 1 if hi else int(lo, 16) + 1))
    return out


def unicode_range(codepoints: set[int]) -> str:
    """Compress a set of codepoints into CSS unicode-range syntax."""
    ranges: list[str] = []
    for cp in sorted(codepoints):
        if ranges and cp == prev + 1:  # type: ignore[name-defined]
            ranges[-1] = ranges[-1].split("-")[0] + f"-{cp:04X}"
        else:
            ranges.append(f"{cp:04X}")
        prev = cp
    return ",".join("U+" + r for r in ranges)


def fontsource_ranges(pkg_dir: Path) -> dict[str, str]:
    """face basename -> declared unicode-range from the package's index.css."""
    css = (pkg_dir.parent / "index.css").read_text()
    out: dict[str, str] = {}
    for comment, body in re.findall(r"/\* ([^ ]+) \*/\s*@font-face \{(.*?)\}", css, re.S):
        m = re.search(r"unicode-range: ([^;]+);", body)
        if m:
            out[comment] = m.group(1).strip()
    return out


# --- font helpers ---------------------------------------------------------

def features(font: TTFont) -> set[str]:
    return {
        r.FeatureTag
        for table in ("GSUB", "GPOS")
        if table in font
        for r in font[table].table.FeatureList.FeatureRecord
    }


def build(src: Path, dst: Path, keep: set[int] | None, wght: tuple[int, int] | int | None, rename: dict[str, str] | None = None) -> TTFont:
    """Subset to `keep` codepoints (None = keep all), limit wght, drop hinting.

    Subset before instancing: instancing first leaves HVAR keys that
    _dict_subset can't resolve for glyphs outside the retained set.
    """
    font = TTFont(src)
    if keep is not None:
        keep &= set(font.getBestCmap())
        opts = subset.Options(
            flavor="woff2",
            layout_features="*",
            no_subset_tables=subset.Options._no_subset_tables_default + ["FFTM"],
            hinting=True,
            desubroutinize=False,
            name_IDs="*",
            name_languages="*",
        )
        opts.name_legacy = True
        subsetter = subset.Subsetter(options=opts)
        subsetter.populate(unicodes=keep)
        subsetter.subset(font)
    else:
        font.flavor = "woff2"
    if wght is not None:
        loc = {"wght": wght} if isinstance(wght, int) else {"wght": (wght[0], wght[1])}
        font = instancer.instantiateVariableFont(font, loc, optimize=False)
    if rename:
        for record in font["name"].names:
            text = record.toUnicode()
            for old, new in rename.items():
                text = text.replace(old, new)
            record.string = text.encode(record.getEncoding())
    font.save(dst)
    return font


# --- plan -----------------------------------------------------------------
# (source filename, output filename, keep-set or None for verbatim copy, wght limit)
# Face order in the emitted CSS mirrors fontsource's: less-common subsets first,
# latin-derived faces last — preserving how unicode-range overlaps resolve.
# "REST" keep-set = original latin-file cmap minus CORE.
# Range values: copied faces keep fontsource's declared range verbatim
# (("decl", src_name)); generated faces partition the original declared
# ranges: ("keep", src_name, SET) intersects, ("drop", src_name, SET)
# subtracts — so declared coverage is identical to today.

FAMILIES = [
    {
        "pkg": "geist",
        "family": "Geist Variable",
        "weight": "100 900",
        "faces": [
            ("geist-cyrillic-ext-wght-normal", "geist-cyrillic-ext.woff2", None, None),
            ("geist-cyrillic-wght-normal", "geist-cyrillic.woff2", None, None),
            ("geist-vietnamese-wght-normal", "geist-vietnamese.woff2", None, None),
            ("geist-latin-ext-wght-normal", "geist-exta.woff2", LATIN_EXT_A, (400, 700)),
            ("geist-latin-wght-normal", "geist-ext.woff2", "REST", (400, 700)),
            ("geist-latin-wght-normal", "geist-core.woff2", CORE, (400, 700)),
        ],
        "ranges": {
            "geist-cyrillic-ext.woff2": ("decl", "geist-cyrillic-ext-wght-normal"),
            "geist-cyrillic.woff2": ("decl", "geist-cyrillic-wght-normal"),
            "geist-vietnamese.woff2": ("decl", "geist-vietnamese-wght-normal"),
            "geist-exta.woff2": ("keep", "geist-latin-ext-wght-normal", LATIN_EXT_A),
            "geist-ext.woff2": ("drop", "geist-latin-wght-normal", CORE),
            "geist-core.woff2": ("keep", "geist-latin-wght-normal", CORE),
        },
    },
    {
        "pkg": "geist-mono",
        "family": "Geist Mono Variable",
        "weight": "100 900",
        "faces": [
            ("geist-mono-cyrillic-ext-wght-normal", "geist-mono-cyrillic-ext.woff2", None, None),
            ("geist-mono-cyrillic-wght-normal", "geist-mono-cyrillic.woff2", None, None),
            ("geist-mono-symbols2-wght-normal", "geist-mono-symbols2.woff2", None, None),
            ("geist-mono-vietnamese-wght-normal", "geist-mono-vietnamese.woff2", None, None),
            ("geist-mono-latin-ext-wght-normal", "geist-mono-exta.woff2", LATIN_EXT_A, (400, 500)),
            ("geist-mono-latin-wght-normal", "geist-mono-ext.woff2", "REST", (400, 500)),
            ("geist-mono-latin-wght-normal", "geist-mono-core.woff2", CORE, (400, 500)),
        ],
        "ranges": {
            "geist-mono-cyrillic-ext.woff2": ("decl", "geist-mono-cyrillic-ext-wght-normal"),
            "geist-mono-cyrillic.woff2": ("decl", "geist-mono-cyrillic-wght-normal"),
            "geist-mono-symbols2.woff2": ("decl", "geist-mono-symbols2-wght-normal"),
            "geist-mono-vietnamese.woff2": ("decl", "geist-mono-vietnamese-wght-normal"),
            "geist-mono-exta.woff2": ("keep", "geist-mono-latin-ext-wght-normal", LATIN_EXT_A),
            "geist-mono-ext.woff2": ("drop", "geist-mono-latin-wght-normal", CORE),
            "geist-mono-core.woff2": ("keep", "geist-mono-latin-wght-normal", CORE),
        },
    },
    {
        "pkg": "orbitron",
        "family": "Orbitron Variable",
        "weight": "400 900",
        "rename": {"Orbitron": "OTP Wordmark"},  # OFL Reserved Font Name
        "faces": [
            ("orbitron-latin-wght-normal", "orbitron-ext.woff2", "REST", 700),
            ("orbitron-latin-wght-normal", "orbitron-core.woff2", CORE, 700),
        ],
        "ranges": {
            "orbitron-ext.woff2": ("drop", "orbitron-latin-wght-normal", CORE),
            "orbitron-core.woff2": ("keep", "orbitron-latin-wght-normal", CORE),
        },
    },
]


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.woff2"):
        old.unlink()

    css: list[str] = ["/* Generated by scripts/optimize-fonts.py — do not edit by hand. */\n"]
    report: list[str] = []

    for fam in FAMILIES:
        pkg_dir = NM / fam["pkg"] / "files"
        if not pkg_dir.is_dir():
            sys.exit(f"missing fontsource package: {pkg_dir}")
        rename = fam.get("rename")
        decl_ranges = fontsource_ranges(pkg_dir)
        # "REST" faces hold whatever the latin file covers that core doesn't,
        # so resolve the latin file's cmap before iterating faces.
        latin_cmap = {
            cp
            for src_name, _, keep, _ in fam["faces"]
            if keep == "REST"
            for cp in TTFont(pkg_dir / f"{src_name}.woff2").getBestCmap()
        }
        for src_name, out_name, keep, wght in fam["faces"]:
            src = pkg_dir / f"{src_name}.woff2"
            dst = OUT_DIR / out_name
            if keep is None:
                shutil.copyfile(src, dst)
                font = TTFont(dst)
            else:
                if keep == "REST":
                    keep = latin_cmap - CORE
                font = build(src, dst, keep, wght, rename)
            cmap = set(font.getBestCmap())
            feats = features(font)
            size = dst.stat().st_size
            report.append(
                f"{out_name:34} {size:6}B glyphs={font['maxp'].numGlyphs:4} cps={len(cmap):4} feats={sorted(feats)}"
            )
            spec = fam["ranges"][out_name]
            op, base_name = spec[0], spec[1]
            if op == "decl":
                urange = decl_ranges[base_name]
            else:
                base = cps(decl_ranges[base_name])
                base = (base & spec[2]) if op == "keep" else (base - spec[2])
                # Intersecting with the kept cmap drops codepoints the face
                # never had a glyph for — the file only claims what it has.
                urange = unicode_range(base & cmap)
            fmt = "woff2-variations" if "fvar" in font else "woff2"
            css.append(
                "@font-face {\n"
                f"  font-family: '{fam['family']}';\n"
                "  font-style: normal;\n"
                "  font-display: swap;\n"
                f"  font-weight: {fam['weight']};\n"
                f"  src: url(/fonts/{out_name}) format('{fmt}');\n"
                f"  unicode-range: {urange};\n"
                "}\n"
            )

    CSS_OUT.write_text("\n".join(css))
    print("\n".join(report))
    print(f"\nwrote {len(list(OUT_DIR.glob('*.woff2')))} fonts -> {OUT_DIR}")
    print(f"wrote {CSS_OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
