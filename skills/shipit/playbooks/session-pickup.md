### Session pickup

**You own the resume point. Read the prior trail, don't redo it.**

1. Locate the prior trail. It is one of these:
   - The session transcripts for this workspace. Read only this workspace's own transcripts. Do not glob across every project's transcripts, because that crosses workspace boundaries and reads private chats from unrelated projects. Helper transcripts nest under their parent's. Your adapter says where they live.
   - A session another agent ran in an orchestration tool. Its turns, its screen history and its full conversation are reachable through that tool (see your adapter).
   - A handoff note in the worktree (Done, Left, Decisions, Gotchas), or the pointer line at the end of an orchestration tool's report, if your environment writes them (your adapter says where they are).
   - A resume note at `<config>/shipit/resume/<slug>.md`, where `<config>/shipit/` is the shipit config folder your adapter names and `<slug>` names the task, written by the pause-safely playbook (`playbooks/pause-safely.md`), or a `wip:` commit it left.
   - A pushed branch or an open PR.

   Read the metadata overview and last messages first (the tail of a transcript), then scan back for the decision points. Parse a long transcript in a read-only helper and keep the reduced timeline in the main thread (the **Guard the Context Window** principle, `principles/guard-the-context-window.md`). Pick each helper's model and effort for the job, per the Helpers section of the **shipit** skill.
2. Reconstruct operational state. The branch and worktree, what already landed (`git log`, `git diff` against the base), the open todos, the decisions made, and any helpers the prior session started that still run (see your adapter for how to list them). Their reports went to the prior session, so you will not hear them. Read their state instead. The prior trail is authoritative input. Resist the bias to re-derive it.
3. Diff done vs pending. Compare what shipped against what was planned, name the resume point, do not re-run the prior repro or redo completed work. A "let me verify from scratch" pass means you're treating the trail as untrustworthy when it's authoritative.
4. Route the remaining work to the matching playbook and pick the verdict: continue the execution, ship a finished recommendation, ratify or override a prior conclusion, or postmortem a failed run. The pickup playbook ends here. The routed playbook owns the rest.
5. Verify the inherited claims against the original goal on the real artifact (the **Prove It Works** principle, `principles/prove-it-works.md`). A passing prior self-report is not the proof.

**Reply:** where the prior agent stopped, what you inherited vs redid (ideally nothing redone), the resume point, and the outcome. When the trail had many steps, give the done-versus-pending split as a short table (step, state, evidence) rather than prose.
