#!/usr/bin/env python3
"""Scan markdown prompt files for known prompt-injection and security patterns.

This is a deterministic, regex-based scanner. It is not a substitute for human review,
but it catches the most common malicious patterns before they reach a maintainer.

Usage:
    python3 scripts/scan-prompt-injection.py [file_or_dir ...]

Exit codes:
    0  no issues found
    1  one or more high-severity issues found
    2  usage error
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Pattern definitions
# ---------------------------------------------------------------------------
# Each pattern is (name, severity, regex, description). Severity is one of:
#   critical  – almost certainly malicious; block merge
#   high      – likely malicious or very risky; block merge
#   medium    – suspicious; require human justification
#   low       – informational; warn only

PATTERNS: list[tuple[str, str, re.Pattern[str], str]] = [
    # --- Override / injection attempts -------------------------------------
    (
        "ignore-previous-instructions",
        "critical",
        re.compile(r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions", re.I),
        "Attempts to override prior instructions",
    ),
    (
        "disregard-instructions",
        "critical",
        re.compile(r"disregard\s+(all\s+)?(previous|prior|above|earlier)\s+instructions", re.I),
        "Attempts to disregard prior instructions",
    ),
    (
        "forget-instructions",
        "high",
        re.compile(r"forget\s+(all\s+)?(previous|prior|above|earlier)\s+instructions", re.I),
        "Attempts to make the agent forget prior instructions",
    ),
    (
        "system-prompt-leak",
        "critical",
        re.compile(r"(reveal|show|print|output|repeat|display)\s+(your\s+)?(system|initial|original)\s+(prompt|instructions|message)", re.I),
        "Attempts to extract the system prompt",
    ),
    (
        "developer-mode",
        "high",
        re.compile(r"(enter|switch\s+to|activate|enable)\s+(developer|admin|root|god|unrestricted)\s+mode", re.I),
        "Attempts to enable a privileged or unrestricted mode",
    ),
    (
        "jailbreak-persona",
        "high",
        re.compile(r"you\s+are\s+now\s+(DAN|a\s+naughty|an?\s+evil|a\s+hacker|a\s+malicious)", re.I),
        "Attempts to assign a malicious persona",
    ),
    # --- Data exfiltration ---------------------------------------------------
    (
        "exfiltrate-to-url",
        "critical",
        re.compile(r"(send|post|upload|transmit|exfiltrate)\s+.{0,80}\s+to\s+https?://", re.I),
        "Instructs the agent to send data to an external URL",
    ),
    (
        "webhook-exfiltration",
        "high",
        re.compile(r"webhook\.site|requestbin|pipedream|ngrok", re.I),
        "References a known data-exfiltration service",
    ),
    (
        "read-env-vars",
        "high",
        re.compile(r"(read|print|display|show|output)\s+(all\s+)?(environment|env)\s+variables", re.I),
        "Attempts to read environment variables",
    ),
    (
        "read-credentials",
        "high",
        re.compile(r"(read|print|display|show|output)\s+(api[_-]?keys?|secrets?|tokens?|passwords?|credentials?)\s+(from|in|of)", re.I),
        "Attempts to read credentials or secrets",
    ),
    # --- Code execution / supply chain --------------------------------------
    (
        "execute-arbitrary-command",
        "high",
        re.compile(r"(execute|run|eval)\s+(this|the\s+following|arbitrary)\s+(command|code|script)", re.I),
        "Instructs the agent to execute arbitrary commands",
    ),
    (
        "curl-pipe-bash",
        "critical",
        re.compile(r"curl\s+.{0,120}\|\s*(ba)?sh", re.I),
        "Pipe-to-shell pattern, classic supply-chain attack",
    ),
    (
        "install-untrusted-package",
        "medium",
        re.compile(r"(npm|pip|yarn|pnpm|cargo|go)\s+install\s+.{0,60}(unknown|untrusted|suspicious)", re.I),
        "Instructs installation of an untrusted package",
    ),
    # --- Obfuscation ---------------------------------------------------------
    (
        "base64-instruction",
        "medium",
        re.compile(r"base64\s+(decode|encoded?)\s+.{0,80}(instruction|command|prompt)", re.I),
        "Encoded instruction that may hide malicious content",
    ),
    (
        "unicode-smuggling",
        "medium",
        re.compile(r"[​-‍⁠⁦-⁩﻿]", re.I),
        "Invisible or bidirectional Unicode characters detected",
    ),
    (
        "typoglycemia-attack",
        "low",
        re.compile(r"\b(i?gnore|disregard|revele|sysmte|promtp|insturction)\b", re.I),
        "Possible typoglycemia or scrambled words used to evade detection",
    ),
    # --- Scope / authority ----------------------------------------------------
    (
        "modify-outside-scope",
        "medium",
        re.compile(r"(modify|delete|overwrite)\s+(files?|code|configuration)\s+(outside|beyond)\s+(the\s+)?(project|scope|repository)", re.I),
        "Instructs modification outside the stated scope",
    ),
    (
        "bypass-review",
        "high",
        re.compile(r"(skip|bypass|do\s+not|don't)\s+(code\s+)?review", re.I),
        "Attempts to bypass review processes",
    ),
    (
        "hide-actions",
        "high",
        re.compile(r"(do\s+not|don't)\s+(tell|inform|notify|show)\s+(the\s+)?(user|developer|maintainer)", re.I),
        "Instructs the agent to hide its actions from the user",
    ),
]

# Files/directories to skip entirely
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}
SKIP_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot"}


def scan_file(path: Path) -> list[tuple[str, int, str, str]]:
    """Return list of (severity, line_number, pattern_name, description)."""
    findings: list[tuple[str, int, str, str]] = []
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        print(f"[error] Cannot read {path}: {exc}", file=sys.stderr)
        return findings

    for lineno, line in enumerate(text.splitlines(), start=1):
        for name, severity, pattern, description in PATTERNS:
            if pattern.search(line):
                findings.append((severity, lineno, name, description))

    return findings


def collect_files(targets: list[str]) -> list[Path]:
    """Collect markdown files from the given targets."""
    files: list[Path] = []
    for target in targets:
        p = Path(target)
        if p.is_file():
            if p.suffix in SKIP_EXTENSIONS:
                continue
            files.append(p)
        elif p.is_dir():
            for child in p.rglob("*.md"):
                # Skip hidden dirs and common noise
                if any(part.startswith(".") or part in SKIP_DIRS for part in child.parts):
                    continue
                files.append(child)
        else:
            print(f"[warn] Target not found: {target}", file=sys.stderr)
    return files


def main() -> int:
    targets = sys.argv[1:] or ["prompts", "templates"]
    files = collect_files(targets)

    if not files:
        print("No markdown files found to scan.")
        return 0

    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    all_findings: list[tuple[Path, str, int, str, str]] = []

    for path in files:
        findings = scan_file(path)
        for severity, lineno, name, desc in findings:
            severity_counts[severity] += 1
            all_findings.append((path, severity, lineno, name, desc))

    # Print report
    print("=" * 70)
    print("PROMPT INJECTION SCAN REPORT")
    print("=" * 70)
    print(f"Files scanned: {len(files)}")
    print(f"Findings:      critical={severity_counts['critical']} "
          f"high={severity_counts['high']} "
          f"medium={severity_counts['medium']} "
          f"low={severity_counts['low']}")
    print()

    if all_findings:
        # Sort by severity then file
        order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        all_findings.sort(key=lambda x: (order[x[1]], str(x[0]), x[2]))
        for path, severity, lineno, name, desc in all_findings:
            print(f"[{severity.upper():8}] {path}:{lineno}")
            print(f"           pattern={name}  {desc}")
            print()

    # Exit code based on severity
    if severity_counts["critical"] > 0 or severity_counts["high"] > 0:
        print("RESULT: FAIL — critical or high severity findings detected.")
        return 1
    elif severity_counts["medium"] > 0:
        print("RESULT: WARN — medium severity findings require human review.")
        return 0
    else:
        print("RESULT: PASS — no significant issues found.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
