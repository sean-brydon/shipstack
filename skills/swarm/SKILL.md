---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report with a coverage table. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

Fan out N parallel workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open the todo list with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not a concurrency limit. At most 5 run at once (the router's cap, or the user's), and the rest queue.
4. Pick the worker model. Use the `swarm workers` role in `models.md`. If the role is missing, use the adapter's default for it. A value that means "the session's own model" runs on it. A value that names another vendor runs each worker through that vendor's CLI (e.g. a codex seat), and the adapter says how. If a value can't be used here, use the role's default and say so. For a model race, name each arm's model family up front. Set effort from the budget in `models.md`, then adjust it for the job per the Subagents section of the **shipit** skill (`<skills>/shipit/SKILL.md`).
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Pick where the workers run.

- **Writing, building, serving or measuring workers**: a writing helper in its own worktree per worker, so each gets its own checkout, and its own port and env when it runs a server. A worker that must start from a non-default pushed branch starts from that base. A worker that must start from another branch checks it out in its own worktree first. See your adapter for how to start one and how to pin its model.
- **Read-only workers** (a search slice, a verification that writes nothing): a read-only helper with the step 4 model and effort. A seat on another vendor runs read-only, or in its own `git worktree add` checkout when it writes.

Start up to 5 workers at once (or the user's cap), then end your turn. Start a queued worker as each one reports, until all N have run. Each reports back when it ends. Don't poll.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first. Never put secrets in a brief.

If a worker drops out, proceed with N-1 and note it. A worker whose report says it is waiting needs a person. Tell the user which worker and why. Never answer for them.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

The result table is the evidence, so the user sees it, not only a summary of it. One row per slice or arm, with these columns: `slice` (or `arm`), `worker` (model, and worktree or helper label), `sha` and `method` where the brief named them, `verdict` (`PASS` / `ISSUES` / `BLOCKED` / `gap` / `dropout`), `status` (`pass` / `fail` / `skip`, so a viewer can colour the rows), `issues` (count), and `evidence` (one line, or the path to it). For a race, add a `rank` column and state the rule above the table.

- Write it as a CSV outside the repo's tracked files and make it something the user can open, with the rule or done predicate as its note (see your adapter). For a long swarm, publish it early and rewrite the file as results land, so the user watches coverage fill in.
- With no more than about eight rows, a markdown table in the reply is enough.

Then return one consolidated in-chat report with the table (or its artifact link and the totals), issue one-liners, gaps or dropouts, and the race rule when used. Name where the table's data came from (the briefs and the worker reports).
