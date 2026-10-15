---
name: figure-it-out
description: "Design an auditable playbook when no narrower one fits, such as a large migration, an ambitious multi-part change, or work a human reviews after stepping away. Scales rigor to the task, runs a hypothesis loop, and logs decisions. Use for /figure-it-out or 'figure it out'."
disable-model-invocation: true
---

# Figure it out

When the task matches no playbook, design one. The deliverable before any code is the workflow itself: a sequence of phases that scales rigor to the task, runs the scientific method, and leaves a decision trail a human can audit after stepping away.

## Start

Open the todo list. Its first item is to read the Principles section of the **shipit** skill. Then add the phases below as todos.

## Phase A: Frame

Ground first, then commit. Don't start the run until you can state:

- The definition of done as a falsifiable predicate (the **Prove It Works** principle, `<skills>/shipit/principles/prove-it-works.md`).
- Scope, quantified: rough units and effort, plus the blockers grounding surfaced.
- The rigor level, biased high. One-way doors and high blast radius get more. Reversible low-stakes steps get less. Rigor is gates and artifacts, not "try harder".

Present the framing and tradeoffs before committing to a long run. Show it as an artifact if you can (the predicate, the scope numbers, the rigor level, the risks, and the one question if there is one), else put it in the reply. Reversible work proceeds (the **Never Block on the Human** principle, `<skills>/shipit/principles/never-block-on-the-human.md`), but a multi-hour run earns one checkpoint. A long run assumes a permission mode or allowlist that lets it work without stalling on prompts. Say so if the session has neither.

## Phase B: Design the workflow

Decompose into atomic, independently-landable units. Sequence riskiest-unknown-first. Scaffold and verification come before features (the **Foundational Thinking** principle, `<skills>/shipit/principles/foundational-thinking.md`).

- Build the verification harness before the work, with the baseline captured from the pre-change state, so the check reads as "old value vs new value".
- For one-way-door design decisions, run the **architect** skill (it runs **arena**). Skip it for mechanical work whose shape is already concrete. A second arena over a settled design is over-engineering (the **Laziness Protocol** principle, `<skills>/shipit/principles/laziness-protocol.md`).
- Decide what fans out. Parallelize only across seams, and give each worker its own worktree or branch (the **Separate Before Serializing Shared State** principle, `<skills>/shipit/principles/separate-before-serializing-shared-state.md`). Spawn one writing helper per worker, each in its own worktree. Don't over-fan. Set each helper's model and effort for the job, per the Helpers section of the **shipit** skill.
- Write the designed phase list down. That list is what the human reviews.

Then execute the design. Add its steps to the todo list as concrete items between the Phase C and Phase D entries. Run each under the Phase C loop discipline, and weave the Phase D log through them, a row as each step lands, rather than saving the whole trail for the end.

## Phase C: Run the loop

Each unit is an experiment. State the hypothesis, make the smallest change, measure against the predicate on the real artifact, keep it if it advanced, revert it if it didn't. Apply the **Sequence Work into Verifiable Units** principle (`<skills>/shipit/principles/sequence-verifiable-units.md`), verifying each unit before starting the next instead of batching checks at the end.

- Verify by inspecting the artifact, never a self-report. When something passes too easily, suspect the observation method before the system.
- Pair delegated work with a judge. If a worker games the gate, reset and harden the contract. If the gate itself is wrong, fix the gate in its own change rather than routing around it.
- A verdict is VERIFIED, NOT VERIFIED, or INCONCLUSIVE. Inconclusive is not a pass. Don't hide a negative.
- Waiting on workers is not polling. Helpers report back when they finish. End your turn. For something they can't see, such as CI on GitHub, run `gh pr checks --watch` in the background, or poll on an interval (see your adapter).

## Phase D: Keep the audit trail

Log the run via the **show-me-your-work** skill. figure-it-out's work is usually ambitious enough to commit the trail so the reviewer can read it in the PR. The trail plus the diff is what lets the human come back and trust the work. Keep the trail visible while the run goes: if you can make an artifact that updates live, register the log as a table artifact once and rewrite it as rows land.

## Phase E: Verify and hand back

Check the whole against the Phase A predicate on the real product, not just the harness. For a UI, that means the real page, driven with the browser driver the environment has (see your adapter), or the project's own Playwright. Encode any recurring correction as a gate, a lint rule, a hook, a check, or a script (the **Encode Lessons in Structure** principle, `<skills>/shipit/principles/encode-lessons-in-structure.md`, and the **correct** skill).

**Reply:** the playbook you designed, the rigor level and why, the decision-trail path (and its artifact), what's verified against the predicate with the evidence, and what's still open.
