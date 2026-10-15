---
name: arena
description: "Spawn N parallel candidates at the same task in isolated worktrees, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
disable-model-invocation: true
---

# Arena

Open the todo list with one entry per phase (Frame, Fan out, Cross-judge, Pick, Graft, Verify) before launching anything.

## Phase A: Frame

Every candidate gets the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric, 3-6 concrete gradeable criteria for what success looks like on *this* task. It is the picker's tool in Phase D. Candidates only see the task.
3. Pick the runners. Use the `arena runners` role in `models.md`, one runner per entry. If the role is missing, use the adapter's default panel, which is three runners from different model families. An entry that means "the session's own model" runs on it. An entry that names another vendor runs through that vendor's CLI (e.g. a codex seat), and the adapter says how. If an entry can't run here, run that seat on the panel's first entry and say so. Spawn more runners when the arena covers multiple design directions. Run at most 5 at once (the router's cap, or the user's) and queue the rest. Use the same model N times when the work is generation-bound rather than judgment-sensitive. Set each runner's effort from the budget in `models.md`, then adjust it for the job per the Subagents section of the **shipit** skill (`<skills>/shipit/SKILL.md`). Keep the family each entry names, so the panel stays diverse.
4. Give each candidate its own isolated output location, per the **Separate Before Serializing Shared State** principle (`principles/separate-before-serializing-shared-state.md`). Pick the mechanism now:
   - **code**: a writing helper in its own worktree per runner, each with its own branch, and its own port and env when the code runs a server. A seat on another vendor gets its own `git worktree add` checkout. See your adapter for how to start each one and how to pin its model. If the adapter can only run one model for helpers, get family diversity from a seat on another vendor, or say the panel is one family.
   - **not code** (a doc, a plan, a prompt): a directory per candidate is enough isolation. Put it under the session's scratch directory when there is one, else a per-run directory the adapter names. Anything the user sees goes on the `pr-assets` branch or in an artifact.

## Phase B: Fan out

Launch up to 5 runners at once (or the user's cap), and start each queued runner as one finishes. Each gets the task, the path to the shared grounding (write it to one file every runner can read and pass the path, rather than inlining it), its own output location, and instructions to produce the artifact and a short rationale naming the alternatives it considered and what it rejected. Code runners commit their work on their own branch so the diff is reviewable. Never put secrets in a runner's prompt.

Then end your turn. Each runner reports back when it ends. Don't poll. See your adapter for how a report arrives and how to read it.

If your environment can run one prompt across several agents in separate worktrees, verify them with a check, and leave the pick to the user, use that when the user wants to pick. Arena's own Phase D pick and Phase E graft need the per-runner worktrees above.

If a candidate produces no output, proceed with N-1 and note the dropout.

## Phase C: Cross-judge

After all Phase B candidates complete, choose one model from the `arena cross-judge pool` role in `models.md`. If the role is missing, use the adapter's default for it. Prefer a different model family from the session's. Spawn one read-only helper on that model, with a prompt that says it must not edit files. The judge sees the rubric and the candidates by path label (worktree path or branch), scores each criterion, and recommends a base with rationale. It runs in parallel with your reading in Phase D. Don't spawn it while candidates are still writing.

## Phase D: Pick a base

Read every candidate end to end before picking. For code, read `git diff <base>...<candidate branch>` for each, not only the runner's summary. Score each against the rubric criterion by criterion, not on holistic feel, and compare with the cross-judge. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base a future maintainer can extend most easily without breaking invariants. When two feel tied, prefer the cleaner boundary or smaller API, per the **Laziness Protocol** principle (`principles/laziness-protocol.md`).

**Show the comparison.** The user decides whether to trust the pick from this, so it is an artifact, not prose:

- A table with one row per runner (label, model, effort, worktree or branch) and one column per rubric criterion, holding your score and the judge's score (`4 / 3`), then a total and a `picked` column.
- A diff summary per candidate: files changed, lines added and removed (`git diff --stat <base>...<branch>`, or the change summary in its report), and one sentence on its shape.
- Under the table, the source. The rubric, the branches, and the commands that produced the stats.

Write the table as a CSV and the diff summary as Markdown, outside the repo's tracked files, and make each an artifact the user can open. Rewrite the files to update them after the graft. See your adapter for how to publish an artifact. With fewer than three runners, put both as markdown tables in the reply.

## Phase E: Graft

Walk each losing candidate once more for what is worth porting into the base, usually one or two things per candidate, not most of it. Fold each graft in by hand, per the **Redesign from First Principles** principle (`principles/redesign-from-first-principles.md`), so the result stays coherent under one mental model. Don't paste mechanically.

If the candidates converge on one shape, that is strong agreement. Note it and ship the consensus shape. No graft is needed. If they wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

Verify the synthesized artifact like any other output, per the **Prove It Works** principle (`principles/prove-it-works.md`). If verification finds a problem the arena missed, either Phase A was wrong (re-frame and re-run) or a candidate caught it and you missed the graft (go back to Phase E). Don't paper over it.

Clean up after the pick. Remove the losing worktrees you created (`git worktree remove`), or tell the user which worktrees are left and how to clear them (see your adapter). Never delete a worktree you did not create.

## Outputs

One synthesized artifact, the comparison artifact from Phase D, and a short synthesis note alongside naming the base and why, the cross-judge's verdict, each graft with its source candidate, what was rejected and why, any convergence or dropouts, and the verification result.
