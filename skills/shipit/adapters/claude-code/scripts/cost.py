#!/usr/bin/env python3
"""Cost receipt for a Claude Code session and its subagents, at list API prices.

    python3 -I ~/.claude/skills/shipit/adapters/claude-code/scripts/cost.py              # this session
    python3 -I cost.py --session <id> [--csv out.csv] [--all-agents]

Reads ~/.claude/projects/<slug>/<session>.jsonl and <session>/subagents/*.jsonl.
On a subscription the dollars are usage, not a bill.
"""
import argparse
import csv
import glob
import json
import os
import sys

PRICES_AS_OF = "2026-10"
# $ per million tokens: input, output, cache read, cache write
PRICES = {
    "fable": (10.0, 50.0, 0.25, 12.5),
    "opus": (4.0, 20.0, 0.20, 5.0),
    "sonnet": (2.0, 10.0, 0.20, 2.5),
    "haiku": (0.10, 0.50, 0.01, 0.125),
    "haiku-long": (0.50, 2.50, 0.05, 0.625),
}
HAIKU_LONG_PROMPT = 100_000


def family(model):
    for name in ("fable", "mythos", "opus", "sonnet", "haiku"):
        if name in (model or ""):
            return "fable" if name == "mythos" else name
    return None


def read_usage(path):
    """One usage per API message: the last record for each message id wins."""
    last, chars = {}, {}
    for line in open(path, encoding="utf-8", errors="replace"):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        if d.get("type") != "assistant":
            continue
        m = d.get("message") or {}
        if not m.get("id") or not m.get("usage"):
            continue
        last[m["id"]] = (m.get("model"), m["usage"])
        for b in m.get("content") or []:
            if isinstance(b, dict):
                text = b.get("text") or b.get("thinking") or (json.dumps(b["input"]) if "input" in b else "")
                chars[m["id"]] = chars.get(m["id"], 0) + len(text)
    # Transcripts can under-record output tokens; never count less than the visible output (~4 chars a token).
    out = []
    for mid, (model, u) in last.items():
        u = dict(u)
        u["output_tokens"] = max(u.get("output_tokens", 0), chars.get(mid, 0) // 4)
        out.append((model, u))
    return out


def price(calls):
    t = {"calls": 0, "input": 0, "cache_write": 0, "cache_read": 0, "output": 0, "usd": 0.0}
    models = set()
    for model, u in calls:
        fam = family(model)
        if fam is None:
            continue
        models.add(model)
        i, o = u.get("input_tokens", 0), u.get("output_tokens", 0)
        cr, cw = u.get("cache_read_input_tokens", 0), u.get("cache_creation_input_tokens", 0)
        key = "haiku-long" if fam == "haiku" and i + cr + cw > HAIKU_LONG_PROMPT else fam
        pi, po, pr, pw = PRICES[key]
        t["calls"] += 1
        t["input"] += i
        t["output"] += o
        t["cache_read"] += cr
        t["cache_write"] += cw
        t["usd"] += (i * pi + o * po + cr * pr + cw * pw) / 1e6
    t["model"] = ", ".join(sorted(m.replace("claude-", "") for m in models)) or "?"
    return t


def find_transcript(session):
    hits = glob.glob(os.path.expanduser(f"~/.claude/projects/*/{session}.jsonl"))
    if not hits:
        sys.exit(f"no transcript for session {session} under ~/.claude/projects")
    return hits[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--session", default=os.environ.get("CLAUDE_CODE_SESSION_ID"))
    ap.add_argument("--csv", help="also write one row per agent to this file")
    ap.add_argument("--all-agents", action="store_true", help="list every subagent, not just the top 12")
    a = ap.parse_args()
    if not a.session:
        sys.exit("no session id: pass --session or run inside Claude Code")

    main_path = find_transcript(a.session)
    rows = [("this session", "main") + tuple(price(read_usage(main_path)).items())]
    sub_dir = main_path[: -len(".jsonl")] + "/subagents"
    for path in sorted(glob.glob(sub_dir + "/agent-*.jsonl")):
        meta = {}
        try:
            meta = json.load(open(path[: -len(".jsonl")] + ".meta.json"))
        except (OSError, ValueError):
            pass
        t = price(read_usage(path))
        if t["calls"]:
            rows.append((meta.get("description") or os.path.basename(path), meta.get("agentType", "")) + tuple(t.items()))

    table = [dict(name=r[0], type=r[1], **dict(r[2:])) for r in rows]
    total = sum(r["usd"] for r in table)
    sub = sum(r["usd"] for r in table[1:])
    by_model = {}
    for r in table:
        by_model[r["model"]] = by_model.get(r["model"], 0) + r["usd"]

    print(f"Cost receipt (list API prices as of {PRICES_AS_OF}; output is a floor, hidden thinking is not in transcripts; on a subscription this is usage, not a bill)")
    print(f"total ${total:.2f} · this session ${table[0]['usd']:.2f} · {len(table) - 1} subagents ${sub:.2f}")
    print("by model: " + " · ".join(f"{m} ${v:.2f}" for m, v in sorted(by_model.items(), key=lambda x: -x[1])))
    print()
    print("| agent | model | calls | cache read | cache write | output | $ |")
    print("|---|---|---|---|---|---|---|")
    shown = table if a.all_agents else [table[0]] + sorted(table[1:], key=lambda r: -r["usd"])[:12]
    for r in shown:
        print(f"| {r['name']} | {r['model']} | {r['calls']} | {r['cache_read']:,} | {r['cache_write']:,} | {r['output']:,} | {r['usd']:.2f} |")
    if len(shown) < len(table):
        print(f"| …{len(table) - len(shown)} more | | | | | | {sum(r['usd'] for r in table if r not in shown):.2f} |")
    if a.csv:
        with open(a.csv, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(table[0].keys()))
            w.writeheader()
            w.writerows(table)


if __name__ == "__main__":
    main()
