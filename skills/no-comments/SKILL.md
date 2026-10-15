---
name: no-comments
description: "Spawn Comment Sicko, fix accepted findings, and offer encodings for claimed constraints."
disable-model-invocation: true
---

# No comments

Spawn Comment Sicko. Act on accepted findings.

Defer to Comment Sicko's fresh perspective.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the base branch, default `main`, including the working tree.

## Steps

1. Spawn the `Agent` tool with `subagent_type: "comment-sicko"`. Pass the scope. Pick its `model` and `effort` for the job, per the Subagents section of the **shipit** skill (`~/.claude/skills/shipit/SKILL.md`). Do not restate its rules. Comment Sicko is read-only. It reports each kill as a location and the comment's text, and you apply the deletions.
2. Inspect its report. Reject kills of application code, scope escapes, kills of exception-protected comments, misstated `MUST KILL` reasons, and flags that treat kept intentional code as guilty. Reshape flags on our-code surprises stay actionable. Do not keep those comments. A keep survives only with proof it is about something we cannot change. Audit missed scoped lint and TypeScript suppressions. Correctness or safety suppressions stay actionable `MUST KILL`s. Spare a killed comment only with exact exceptions and scoped proof. Before accepting thin `IMPORTANT` or `do not remove` kills or keeps, run the **how** or **why** skill (`~/.claude/skills/how/SKILL.md`, `~/.claude/skills/why/SKILL.md`) on their symbol. If a kill is ambiguous, do not spare it. If a keep is refuted or still ambiguous, delete it. Rerun one rejected report in a fresh Comment Sicko with the failure named. Reject a second, report it open, and fail `/no-comments`.
3. Delete every accepted kill. Fix trivial accepted flags directly by deleting a dead path, dropping a parameter, or using the real API. If any fix needs a shape, run the **architect** skill (`~/.claude/skills/architect/SKILL.md`) once for the accepted set and surrounding code. Stop at the sketch. Architect shapes. Step 4 implements.
4. Implement the smallest root-cause fix in scope. Remove every named workaround. If the root cause is out of scope, land the smallest in-scope fix and report the rest open. The [Fix Root Causes](~/.claude/skills/shipit/principles/fix-root-causes.md) and [Redesign From First Principles](~/.claude/skills/shipit/principles/redesign-from-first-principles.md) principles guide intent only. Neither authorizes widening the fence nor fixing instances outside it. Never bolt on symptom guards.
5. Constraint comments say `do not remove`, `do not change wording`, or `talk to X before changing`. Leave keeps about things we cannot change. Offer the cheapest in-scope type, runtime, test, or CI lint. Wait for interactive approval. Unattended and eval require caller pre-approval. If approved, encode then delete. Otherwise delete, report the constraint open, and sketch out-of-scope work.
6. Report the deletion count, spared comments, reruns, architect sketch, fixes, encoding offers, encodings, unenforced constraints, and other open work.
