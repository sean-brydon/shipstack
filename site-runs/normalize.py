#!/usr/bin/env python3
"""Turn a `claude -p --output-format stream-json --verbose` log into a run file for the docs site.

    python3 -I normalize.py raw/bugfix.jsonl meta.json > ../site/content/runs/bugfix.json

meta.json holds what the log can't know: id, title, command, playbook, environment, repo,
recorded, notes, and optionally a diff file path ("diff_file").
"""
import json
import sys

MAX_IO = 2400


def trim(s, n=MAX_IO):
    s = s if isinstance(s, str) else json.dumps(s, indent=1, ensure_ascii=False)
    s = s.strip()
    return s if len(s) <= n else s[: n - 40].rstrip() + f"\n… ({len(s) - n + 40} more characters)"


def result_text(content):
    if isinstance(content, str):
        return content
    out = []
    for c in content or []:
        if isinstance(c, dict) and c.get("type") == "text":
            out.append(c.get("text", ""))
        elif isinstance(c, dict) and c.get("type") == "image":
            out.append("[image]")
    return "\n".join(out)


SUMMARY_KEYS = ("command", "file_path", "pattern", "description", "query", "url", "skill", "path", "prompt")


def summarize(name, inp):
    if not isinstance(inp, dict):
        return ""
    for k in SUMMARY_KEYS:
        if inp.get(k):
            v = str(inp[k]).strip().splitlines()[0]
            return v[:140]
    return ""


def main():
    log, meta_path = sys.argv[1], sys.argv[2]
    meta = json.load(open(meta_path))
    steps, agents, labels = [], {}, {}
    pending = {}
    init_model = None
    final = None
    for line in open(log, encoding="utf-8", errors="replace"):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        t = d.get("type")
        if t == "system" and d.get("subtype") == "init":
            init_model = d.get("model")
            continue
        if t == "result":
            final = d
            continue
        parent = d.get("parent_tool_use_id")
        agent = labels.get(parent, "main") if parent else "main"
        msg = d.get("message") or {}
        if t == "assistant":
            model = msg.get("model")
            if model and model != "<synthetic>":
                agents.setdefault(agent, model)
            for b in msg.get("content") or []:
                if b.get("type") == "text" and b.get("text", "").strip():
                    steps.append({"kind": "text", "agent": agent, "text": trim(b["text"], 4000)})
                elif b.get("type") == "tool_use":
                    inp = b.get("input") or {}
                    step = {"kind": "tool", "agent": agent, "name": b.get("name"), "summary": summarize(b.get("name"), inp),
                            "input": trim(inp), "output": "", "is_error": False}
                    if b.get("name") in ("Agent", "Task"):
                        sub = inp.get("subagent_type") or "agent"
                        labels[b["id"]] = f"{sub}: {inp.get('description') or step['summary']}"[:80]
                        if inp.get("model"):
                            step["summary"] = f"{labels[b['id']]} ({inp['model']}{', ' + inp['effort'] if inp.get('effort') else ''})"
                    pending[b["id"]] = step
                    steps.append(step)
        elif t == "user":
            for b in msg.get("content") or [] if isinstance(msg.get("content"), list) else []:
                if isinstance(b, dict) and b.get("type") == "tool_result" and b.get("tool_use_id") in pending:
                    s = pending.pop(b["tool_use_id"])
                    s["output"] = trim(result_text(b.get("content")))
                    s["is_error"] = bool(b.get("is_error"))
    if final is None:
        sys.exit("no result event in log")
    agents.setdefault("main", init_model)
    diff = None
    if meta.get("diff_file"):
        try:
            diff = open(meta.pop("diff_file")).read() or None
        except OSError:
            meta.pop("diff_file", None)
    run = {
        "id": meta["id"], "title": meta["title"], "command": meta["command"], "playbook": meta.get("playbook"),
        "environment": meta["environment"], "repo": meta["repo"], "prompt": meta["prompt"],
        "model": agents.get("main") or init_model, "recorded": meta["recorded"],
        "duration_s": round((final.get("duration_ms") or 0) / 1000),
        "cost_usd": round(final.get("total_cost_usd") or 0, 2), "turns": final.get("num_turns"),
        "agents": [{"label": k, "model": v} for k, v in agents.items()],
        "steps": steps, "result": final.get("result") or "", "diff": diff, "notes": meta.get("notes", []),
    }
    json.dump(run, sys.stdout, indent=1, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
