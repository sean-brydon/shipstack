---
title: "/swarm"
description: "Fan out N parallel workers, drain them, and return one report with a coverage table. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
---

Fan out N parallel workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not a concurrency limit. At most 5 run at once (the router's cap, or the user's), and the rest queue.
4. Pick the worker model. Read `~/.claude/shipit/models.md` if it exists and use its `swarm workers` line. If the file or that line is missing, use `sonnet`. For `inherit`, omit `model` so the workers run on the parent model. A `codex` value runs each worker on Codex (Phase B says how). If the Agent tool rejects a value, use `sonnet` and say so. For a model race, name each arm's model up front (`opus`, `sonnet`, `haiku`, `fable`, `codex`). Set `effort` from the file's budget line (`unlimited` max, `large` xhigh, `medium` high, `small` medium, default `large`), then adjust it for the job per the Subagents section of the **shipit** skill ([`~/.claude/skills/shipit/SKILL.md`](/skills/shipit)).
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Pick where the workers run.

- **berth available** (`BERTH_*` set, `berthd` on PATH, or `mcp__berth__*` tools listed): one berth task per worker that writes, builds, runs a server, or measures, so each gets its own worktree, port, and env on the box. `berth_task_new` (`location`, `name: swarm-<slug>-<n>`, `agent: claude` or `codex`, `prompt`, and `base` when the worker must start from a non-default pushed branch), or `berthd task new <loc>/swarm-<slug>-<n> --agent claude --base <ref> --prompt "…"`. The Claude model comes from the location's agent preset, as the **arena** skill's Phase A explains.
- **no berth**, or read-only workers: the Agent tool, `subagent_type: "general-purpose"` (or `"Explore"` for a read-only search slice), with the step 4 `model` and `effort`. Add `isolation: "worktree"` for every worker that writes, so no two share a checkout. A worker that must start from another branch checks it out in its own worktree first. A `codex` worker runs `codex exec -s read-only -C <dir> -o <answer file> - < <prompt file>` in a background Bash (`-s workspace-write` in its own `git worktree add` checkout when it writes).

Spawn up to 5 workers in one message (or the user's cap), then end your turn. Start a queued worker as each one reports, until all N have run. Each reports back when it ends (a `<berth-notification>`, or the Agent tool's or background Bash's completion notice). Don't poll.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first. Never put secrets in a brief.

If a worker drops out, proceed with N-1 and note it. A berth worker whose report says `status="waiting"` needs a person. Tell the user which worker and why. Never answer for them.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

The result table is the evidence, so the user sees it, not only a summary of it. One row per slice or arm, with these columns: `slice` (or `arm`), `worker` (model, and berth worktree or Agent label), `sha` and `method` where the brief named them, `verdict` (`PASS` / `ISSUES` / `BLOCKED` / `gap` / `dropout`), `status` (`pass` / `fail` / `skip`, so berth colours the rows), `issues` (count), and `evidence` (one line, or the path to it). For a race, add a `rank` column and state the rule above the table.

- Inside berth: write it as a CSV outside the repo's tracked files and register it with `berthd artifact add <file>.csv --title "Swarm: <goal>" --note "<rule or done predicate>"` (see the **berth-artifacts** skill). For a long swarm, register it early and rewrite the file as results land, so the user watches coverage fill in.
- Outside berth: publish it with the `Artifact` tool (load the **artifact-design** skill first) when it has more than about eight rows, else a markdown table in the reply.

Then return one consolidated in-chat report with the table (or its artifact link and the totals), issue one-liners, gaps or dropouts, and the race rule when used. Name where the table's data came from (the briefs and the worker reports).
