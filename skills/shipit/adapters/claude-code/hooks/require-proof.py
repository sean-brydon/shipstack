#!/usr/bin/env python3
"""Claude Code PreToolUse hook: refuse `gh pr create` without a Proof section.

The PR body needs a `## Proof` heading with at least one line of content under it.
One line is enough for a nit ("`go test ./internal/proxy/...` passed"). The point is
that proof is stated on purpose, not that every PR carries screenshots.
Exit 2 blocks the call and tells the agent why; anything else lets it through.
"""
import json
import re
import shlex
import sys

PROOF = re.compile(r"(?:^|[\"'])[ \t]*#{2,3}[ \t]*Proof\b[^\n]*\n(?P<rest>.*)", re.M | re.S)


def body_of(command):
    try:
        args = shlex.split(command, posix=True)
    except ValueError:
        args = command.split()
    for i, a in enumerate(args):
        if a in ("--body-file", "-F") and i + 1 < len(args):
            path = args[i + 1]
            if path == "-":
                return None
            try:
                return open(path, encoding="utf-8").read()
            except OSError:
                return None
        if a.startswith("--body-file="):
            try:
                return open(a.split("=", 1)[1], encoding="utf-8").read()
            except OSError:
                return None
    # --body "...", -b "...", or a heredoc inside $(...): search the whole command text.
    return command


def has_proof(body):
    m = PROOF.search(body or "")
    if not m:
        return False
    for line in m.group("rest").splitlines():
        if line.startswith("#"):
            return False
        if line.strip():
            return True
    return False


def main():
    try:
        data = json.load(sys.stdin)
    except ValueError:
        return 0
    if data.get("tool_name") != "Bash":
        return 0
    command = (data.get("tool_input") or {}).get("command", "")
    if not re.search(r"\bgh\s+pr\s+create\b", command):
        return 0
    if "--fill" in command and not re.search(r"--body|-b\s|-F\s", command):
        body = ""
    else:
        body = body_of(command)
        if body is None:
            return 0
    if has_proof(body):
        return 0
    sys.stderr.write(
        "Blocked: this PR has no `## Proof` section. Add one with the evidence that fits the change "
        "(~/.claude/skills/shipit/references/proof-pack.md): for a nit, the one check you ran and its result; "
        "for backend, the checks plus one real run of the changed path; for UI, light and dark screenshots. "
        "If there is honestly nothing to prove, say so under the heading and why.\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
