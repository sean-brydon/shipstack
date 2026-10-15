#!/usr/bin/env python3
"""Name the GitHub owners auto mode should treat as your own source control.

    python3 -I automode_repos.py scan                       # owners and repos found locally, as JSON
    python3 -I automode_repos.py apply --owners a,b --dry-run   # show the lines it would write
    python3 -I automode_repos.py apply --owners a,b         # write them (backup kept next to settings.json)

Rewrites only the repo lines of autoMode.environment in ~/.claude/settings.json
(Organization, Repository visibility, Default / protected branches, Source control,
Trusted repo). Every other line and every other setting is left as it is.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time

SETTINGS = os.path.join(os.environ.get("CLAUDE_CONFIG_DIR", os.path.expanduser("~/.claude")), "settings.json")
ROOTS = ["~", "~/personal", "~/work", "~/projects", "~/code", "~/src", "~/dev"]
GITHUB = re.compile(r"(?:git@github\.com:|https://github\.com/)([^/\s]+)/([^/\s]+?)(?:\.git)?/?$")


def remotes():
    seen = {}
    for root in ROOTS:
        root = os.path.expanduser(root)
        if not os.path.isdir(root):
            continue
        for name in sorted(os.listdir(root)):
            path = os.path.join(root, name)
            if not os.path.isdir(os.path.join(path, ".git")):
                continue
            try:
                out = subprocess.run(["git", "-C", path, "remote", "-v"], capture_output=True, text=True, timeout=5).stdout
            except (OSError, subprocess.SubprocessError):
                continue
            for line in out.splitlines():
                parts = line.split()
                m = GITHUB.match(parts[1]) if len(parts) > 1 else None
                if m:
                    seen.setdefault(m.group(1), set()).add(m.group(2))
    return seen


def gh(*args):
    try:
        return subprocess.run(["gh", *args], capture_output=True, text=True, timeout=15).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def scan():
    found = remotes()
    login = gh("api", "user", "--jq", ".login")
    orgs = [o for o in gh("api", "user/orgs", "--jq", ".[].login").splitlines() if o]
    owners = sorted(found, key=lambda o: (o != login, o not in orgs, -len(found[o]), o))
    print(json.dumps({
        "login": login,
        "orgs": orgs,
        "owners": [{"owner": o, "repos": sorted(found[o]), "yours": o == login, "member": o in orgs} for o in owners],
    }, indent=2))


def lines_for(owners, login):
    trusted = ", ".join(f"{o}/*" for o in owners)
    orgs = [o for o in owners if o != login]
    org = "GitHub"
    if login in owners:
        org += f": personal account `{login}`"
    if orgs:
        org += ("; " if login in owners else ": ") + "orgs " + ", ".join(f"`{o}`" for o in orgs)
    return {
        "**Organization**": f"**Organization**: {org}",
        "**Repository visibility**": f"**Repository visibility**: mixed; repos under {trusted} may be public, so never commit or push secrets, tokens or private data to them",
        "**Default / protected branches**": "**Default / protected branches**: `main` on each trusted repo; work happens on branches and lands through PRs; force-pushing a shared branch, pushing directly to `main` and merging a PR the user did not approve still need the user",
        "**Source control**": f"**Source control**: GitHub. Trusted owners: {trusted}. Creating branches, pushing them and opening PRs on repos under these owners is routine work. Repos under any other owner are not trusted by default",
        "**Trusted repo**": f"**Trusted repo**: any checkout whose `origin` is under {trusted}; scope work to the checkout the agent is operating in, not its siblings",
    }


def apply(owners, dry_run):
    text = open(SETTINGS, encoding="utf-8").read()
    settings = json.loads(text)
    env = settings.setdefault("autoMode", {}).setdefault("environment", [])
    login = gh("api", "user", "--jq", ".login")
    new = lines_for(owners, login)
    changes, done = [], set()
    for i, line in enumerate(env):
        for label, value in new.items():
            if isinstance(line, str) and line.startswith(label + ":") and label not in done:
                if line != value:
                    changes.append((line, value))
                    env[i] = value
                done.add(label)
    missing = [v for k, v in new.items() if k not in done]
    if missing:
        at = next((i + 1 for i, l in enumerate(env) if isinstance(l, str) and l.startswith("**Source control**")), len(env))
        env[at:at] = missing
        changes += [(None, v) for v in missing]
    if not changes:
        print("Already up to date.")
        return
    for old, value in changes:
        if old:
            print(f"- {old}")
        print(f"+ {value}\n")
    if dry_run:
        print("(dry run: nothing written)")
        return
    backup = f"{SETTINGS}.shipit-{time.strftime('%Y%m%d-%H%M%S')}.bak"
    shutil.copy2(SETTINGS, backup)
    tmp = SETTINGS + ".shipit-tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(json.dumps(settings, indent=2, ensure_ascii=False) + "\n")
    os.replace(tmp, SETTINGS)
    print(f"Wrote {SETTINGS} (backup: {backup}). Check with: claude auto-mode config")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("scan")
    a = sub.add_parser("apply")
    a.add_argument("--owners", required=True, help="comma-separated GitHub owners")
    a.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if args.cmd == "scan":
        scan()
    else:
        owners = [o.strip() for o in args.owners.split(",") if o.strip()]
        if not owners:
            sys.exit("--owners is empty")
        apply(owners, args.dry_run)


if __name__ == "__main__":
    main()
