#!/usr/bin/env python3
"""Run: python3 -I ~/.claude/skills/shipit/adapters/claude-code/hooks/require-proof.test.py"""
import json
import os
import subprocess
import sys

HOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "require-proof.py")
CASES = [
    ('gh pr create --title "fix: typo" --body "## Why\nTypo.\n\n## Proof\n`pnpm check:titles` passed"', 0, "nit with one check"),
    ('gh pr create --title x --body "## Why\nstuff"', 2, "no proof section"),
    ('gh pr create --title x --body "## Proof\n\n## Scope\nx"', 2, "empty proof section"),
    ("gh pr create --title x --body \"$(cat <<'EOF'\n## Why\nA\n\n## Proof\n| check | result |\n|---|---|\n| go test | pass |\nEOF\n)\"", 0, "heredoc body with a checks table"),
    ("gh pr create --fill", 2, "--fill has no proof"),
    ("gh pr view 12", 0, "not a create"),
    ("git status", 0, "not gh"),
    ('gh pr create --title x --body "## Proof\nNothing to prove: README wording only."', 0, "stated nothing-to-prove"),
    ('gh pr create --title x --body "see ## Proof later"', 2, "heading mid-line does not count"),
]
failed = 0
for cmd, want, name in CASES:
    got = subprocess.run([sys.executable, "-I", HOOK], input=json.dumps({"tool_name": "Bash", "tool_input": {"command": cmd}}), capture_output=True, text=True).returncode
    print(("ok  " if got == want else "FAIL") + f" {name}: exit {got}, want {want}")
    failed += got != want
sys.exit(1 if failed else 0)
