#!/usr/bin/env python3
"""Validate prompts/catalog.json against the prompt files on disk.

Every entry must have the required fields, its derived path
(prompts/<phase>/<purpose>/<id>.md) must exist, and every prompt file must have a
catalog entry. Prompt files must not contain YAML frontmatter, a '# Title' heading, or a
'> **When to use:**' note — title and description belong in the catalog so agents
consuming a prompt get clean input.

Usage:
    python3 scripts/validate-catalog.py

Exit codes:
    0  ok
    1  problems found
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS_DIR = ROOT / "prompts"
CATALOG = PROMPTS_DIR / "catalog.json"

VALID_PHASES = {"creation", "existing"}
VALID_PURPOSES = {
    "strategy",
    "foundation",
    "governance",
    "quality",
    "security",
    "documentation",
    "operations",
    "maintenance",
}
REQUIRED_FIELDS = ["id", "title", "description", "phase", "purpose", "one_time", "tags"]


def check_entry(idx: int, entry: object, ids: set[str], files_on_disk: set[str], covered: set[str]) -> list[str]:
    errors: list[str] = []
    where = f"entry[{idx}]"
    if not isinstance(entry, dict):
        return [f"{where}: catalog entry must be an object"]
    pid = entry.get("id")
    where += f" (id={pid!r})"

    for field in REQUIRED_FIELDS:
        if field not in entry:
            errors.append(f"{where}: missing required field '{field}'")

    if isinstance(pid, str):
        if pid in ids:
            errors.append(f"{where}: duplicate id '{pid}'")
        ids.add(pid)

    phase = entry.get("phase")
    purpose = entry.get("purpose")
    if phase not in VALID_PHASES:
        errors.append(f"{where}: phase must be one of {sorted(VALID_PHASES)}")
    if purpose not in VALID_PURPOSES:
        errors.append(f"{where}: purpose must be one of {sorted(VALID_PURPOSES)}")
    if entry.get("one_time") is not True:
        errors.append(f"{where}: one_time must be true")

    description = entry.get("description")
    if "description" in entry and not (isinstance(description, str) and description.strip()):
        errors.append(f"{where}: description must be a non-empty string")

    tags = entry.get("tags")
    if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
        errors.append(f"{where}: tags must be a list of strings")

    source = entry.get("source")
    source_ok = isinstance(source, str) or (
        isinstance(source, list) and all(isinstance(s, str) for s in source)
    )
    if source is not None and not source_ok:
        errors.append(f"{where}: source must be a URL string or a list of URL strings")

    author = entry.get("author")
    if author is not None and not isinstance(author, str):
        errors.append(f"{where}: author must be a string")

    if isinstance(pid, str) and phase in VALID_PHASES and purpose in VALID_PURPOSES:
        expected = f"prompts/{phase}/{purpose}/{pid}.md"
        if expected not in files_on_disk:
            errors.append(f"{where}: expected file missing: {expected}")
        else:
            covered.add(expected)

    return errors


def main() -> int:
    errors: list[str] = []

    if not CATALOG.exists():
        print(f"ERROR: {CATALOG} not found")
        return 1
    try:
        data = json.loads(CATALOG.read_text())
    except json.JSONDecodeError as exc:
        print(f"ERROR: catalog.json is not valid JSON: {exc}")
        return 1
    entries = data.get("prompts")
    if not isinstance(entries, list):
        print("ERROR: catalog.json must contain a top-level 'prompts' list")
        return 1

    files_on_disk = {p.relative_to(ROOT).as_posix() for p in PROMPTS_DIR.rglob("*.md")}

    ids: set[str] = set()
    covered: set[str] = set()
    for i, entry in enumerate(entries):
        errors.extend(check_entry(i, entry, ids, files_on_disk, covered))

    for path in sorted(files_on_disk - covered):
        errors.append(f"{path}: prompt file has no catalog entry")

    for path in sorted(files_on_disk):
        first = (ROOT / path).read_text(encoding="utf-8", errors="replace").lstrip("\n")[:4]
        if first.startswith("---"):
            errors.append(
                f"{path}: contains YAML frontmatter — metadata belongs in catalog.json, "
                "the prompt file must start with its first section"
            )
        text = (ROOT / path).read_text(encoding="utf-8", errors="replace")
        if re.search(r"^# ", text, re.MULTILINE) and re.match(r"\s*# ", text):
            errors.append(
                f"{path}: starts with a '# Title' heading — the title lives in catalog.json only"
            )
        if re.search(r"^>\s*\*\*When to use:\*\*", text, re.MULTILINE):
            errors.append(
                f"{path}: contains a '> **When to use:**' note — use the catalog 'description' instead"
            )

    print("=" * 60)
    print("CATALOG VALIDATION")
    print("=" * 60)
    print(f"Entries: {len(entries)}   Files: {len(files_on_disk)}")
    if errors:
        for e in errors:
            print(f"  {e}")
        print(f"RESULT: FAIL — {len(errors)} problem(s)")
        return 1
    print("RESULT: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
