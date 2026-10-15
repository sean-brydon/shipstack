### Feature

**You own the design. Plan, review, verify.** Delegate implementation. Stay in the lead.

1. Run the **how** skill (`<skills>/how/SKILL.md`) over the affected subsystem.
2. Run the **architect** skill (`<skills>/architect/SKILL.md`) for parallel design exploration.
3. Write the throughput checkpoint as four items in the todo list. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
   - **Blocking first steps.** Gates run before fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize.
   - **Shared mutable state.** Default to splitting the target (the **Separate Before Serializing Shared State** principle, `principles/separate-before-serializing-shared-state.md`). Serialize only for real invariants.
   - **Smallest safe decomposition.** If one worker is best, name why.
4. Delegate code-writing to a writing helper using the `code` role's model with a specific scope (file paths, named data shape and its organizing structure per the **Model the Domain** principle, `principles/model-the-domain.md`, a state machine over scattered booleans, a table/registry over branching, a typed model over repeated shape assumptions, chosen before the helper writes logic, and success criteria). Pick each helper's effort for the job, per the Helpers section of the **shipit** skill (`<skills>/shipit/SKILL.md`). When the implementation admits multiple valid shapes (error handling, abstraction layer, test structure), delegate via the **arena** skill (`<skills>/arena/SKILL.md`) instead so the runners surface the alternatives and the cross-judge guards the pick. Mandatory: no skip-with-reason escape, and Laziness Protocol does not override it (the gain is review separation, not lines saved). A helper forbidden to spawn satisfies this by owning the diff directly with the same review separation. No "standing by" reply that waits on a nested helper. Comments per **Comments**. Surgical edits, re-ground against the source for upstream-derived files. Port shared-primitive improvements to all consumers and verify each. Commit liberally.
5. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it. For anything that shows on a page, drive the new behavior in a browser you control, take screenshots at phone, tablet, and desktop widths, and run a visual diff against main so the user sees what changed (see your adapter for the tools, and for opening the page beside the user). Without those, drive it with the project's own browser tests and take screenshots. For a CLI or TUI, paste the real output.
6. Rebase into small, ordered commits. Follow-ups are their own PRs off trunk once this one merges, not a stack.
   Use the **Sequence Work into Verifiable Units** principle (`principles/sequence-verifiable-units.md`), building, verifying, and committing each small unit before the next.
7. If the design is contested, run the **interrogate** skill (`<skills>/interrogate/SKILL.md`) before shipping.
8. Run **Opening a PR** (`playbooks/opening-a-pr.md`).

Code-coupled work (one feature, one migration) goes to a single owner with the checkpoint inline. That owner fans out internally after the blocking phase. Parent-level fan-out is for slices that produce independent artifacts (audits, cross-subsystem investigations, competing experiments). Rewrite the checkpoint at phase boundaries. Spawn a fresh owner rather than chaining interrupts.

**Reply:** what you built, what you chose and why, the throughput checkpoint, open decisions. Tables for design alternatives. The visual diff or screenshots for any UI change. When the alternatives table is wide or long, make it an artifact.
