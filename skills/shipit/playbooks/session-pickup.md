### Session pickup

**You own the resume point. Read the prior trail, don't redo it.**

1. Locate the prior trail. It is one of these:
   - A Claude Code transcript under this workspace's own directory, `~/.claude/projects/<cwd-slug>/<session-id>.jsonl` (the cwd with every character outside `A-Za-z0-9-` replaced by `-`). Subagent transcripts nest under `<session-id>/`. Do not glob across `~/.claude/projects/*/`, because that crosses workspace boundaries and reads private chats from unrelated projects.
   - A berth session. `berthd session turns NAME --json` lists its turns, `berthd session screen NAME --history 200` shows what it shows, and the `<more>` line of its `<berth-notification>` names where its full conversation is.
   - A berth handoff note at `.berth/handoff/<run>.md` in the worktree (Done, Left, Decisions, Gotchas), written by a `handoff` run.
   - A pause note from `~/.claude/skills/shipit/playbooks/pause-safely.md` at `~/.claude/shipit/resume/<slug>.md`, or a `wip:` commit it left.
   - A pushed branch or an open PR.

   Read the metadata overview and last messages first (the tail of a `.jsonl`), then scan back for the decision points. Parse a long transcript in an `Explore` subagent and keep the reduced timeline in the main thread (the **Guard the Context Window** principle, `~/.claude/skills/shipit/principles/guard-the-context-window.md`). Pick each subagent's model and `effort` for the job, per the Subagents section of `~/.claude/skills/shipit/SKILL.md`.
2. Reconstruct operational state. The branch and worktree, what already landed (`git log`, `git diff` against the base), the open todos, the decisions made, and any agents the prior session started that still run (`berthd sessions --json`). Their reports went to the prior session, so you will not hear them. Read their state instead. The prior trail is authoritative input. Resist the bias to re-derive it.
3. Diff done vs pending. Compare what shipped against what was planned, name the resume point, do not re-run the prior repro or redo completed work. A "let me verify from scratch" pass means you're treating the trail as untrustworthy when it's authoritative.
4. Route the remaining work to the matching playbook and pick the verdict: continue the execution, ship a finished recommendation, ratify or override a prior conclusion, or postmortem a failed run. The pickup playbook ends here. The routed playbook owns the rest.
5. Verify the inherited claims against the original goal on the real artifact (the **Prove It Works** principle, `~/.claude/skills/shipit/principles/prove-it-works.md`). A passing prior self-report is not the proof.

**Reply:** where the prior agent stopped, what you inherited vs redid (ideally nothing redone), the resume point, and the outcome. When the trail had many steps, give the done-versus-pending split as a short table (step, state, evidence) rather than prose.
