### Orchestrate

**You own the program, never the code. Author briefs, drain the queue, keep the frontier green, decide.** For a whole project handed to one standing coordinator chat: multi-day, many PRs (independent off trunk unless the user asked for stacks), dozens to hundreds of subagents over the program's life with at most 5 running at once (the router's cap, or the user's), the human checking in twice a day instead of every five minutes. One task driven to a predicate is Autonomous run. One ambitious run needing a bespoke workflow is figure-it-out. Route here when the work outlives any single agent. Work one agent could finish inside the session's budget is not a program.

Ceremony must scale with the program. On cheap near-identical units, collapse it as each section directs.

A program runs for days, so it assumes Claude Code's auto mode or a permission allowlist. Irreversible actions still reach the human per Escalation.

Three rules carry the rest.

- Completions are queue events, not interrupts.
- Every spawn and every resume carries the standing orders verbatim.
- The brief is the product. A vague brief fails quietly, because a worker cannot ask you a question.

#### Roles and placement

berth is the fleet when it is available (any `BERTH_*` variable set, `berthd` or `berth` on PATH, or the `berth_*` tools listed). Each worker is a berth task with its own worktree, port, and env on a box. It runs in berth's own tmux server, so it outlives this chat. Read the **berth-orchestrate** skill before the first spawn. Without berth, workers are Agent tool subagents with `isolation: "worktree"`, and everything below that names berth has the plain fallback given beside it.

- **Coordinator (this chat).** Frames, authors briefs, drains the inbox, owns the human report, makes judgment calls. It never authors or edits code. Conflicted merges, chain rebases, and code changes are always tasks. The coordinator never pushes to trunk, not as a fast-forward and not as a cherry-pick. Landing is always a PR merged with `gh pr merge`, and only under a merge grant the user gave in a message. Under that grant, merging a verified unit's PR is bookkeeping the coordinator may do itself. Queueing finished work behind an idle stacker is how a deadline harvests nothing. The loop is agentic end to end. Agents are spawned through `berthd task new <loc>/<unit> --agent <id> --prompt "<brief>"` (or the `berth_task_new` tool), or through the Agent tool without berth, and drained from their reports. Pick each subagent's model and `effort` for the job, per the Subagents section of `~/.claude/skills/shipit/SKILL.md`. On berth, the model comes from the agent preset (`berthd agents` lists each preset's id and command, and `berthd info` includes them). When no preset runs the model a role needs, run that unit through the Agent tool instead. State reads and writes go through `orch` at drain points, one command in and one line out. The CLI never spawns, waits, or wakes anything.
- **Sub-coordinator.** Durable, one per track, and only when the program exceeds what one coordinator's drains can manage. A track the coordinator can drain itself needs no middle layer. Each nested layer re-pays a full orientation preamble, and a blocking sub-coordinator hides its children while the parent idles. On berth, a sub-coordinator is a berth task of its own. It is a full Claude Code session that spawns its own workers as berth tasks and hears back from them. berth never reports back in a circle, so its children report to it and it reports to you. Without berth, run the track's drains from the coordinator itself rather than nesting subagents. Owns its track's units and boards, authors its workers' briefs, spawns its own workers and verifiers. Rolls up aggregates at wave boundaries. Never forwards raw child reports. Cap in-flight children at the router's cap (5 running at once unless the user sets another), as a rolling window. Never as blocking batches, which cost the slowest child of every batch.
- **Worker / verifier.** A berth task on a box unless the task needs this machine: a browser in the user's own Chrome (the **claude-in-chrome** skill), reading local Claude Code transcripts under `~/.claude/projects/`, simulators and local IDE state, or auth that exists only here. Those run as local Agent tool subagents. A berth task cannot read the coordinator's local store, so its brief inlines what it needs or points at repo paths. Prefer fewer, broader workers. One writer per worktree or branch (the **Separate Before Serializing Shared State** principle). Run a unit's verifier on a different model family from its worker (a `codex` preset against a `claude` one, or opus against sonnet).

Depth stays at coordinator, track, worker. Author the track decomposition per project (build, landing, and verification are common cuts, not a required shape). Hard-coded swarm trees were tried and parked as too rigid.

#### Store layout

Create `~/.claude/shipit/orchestrate/<project-slug>/` and export it as `ORCH_STORE`. Every file has exactly one writer. Owners publish facts, readers aggregate at read time. Use `bun ~/.claude/skills/shipit/scripts/orch/orch.ts` for bookkeeping, written below as `orch`, while its canonical plain TSV and JSON stay readable without the CLI.

- `preferences.md` is the standing-orders register: numbered lines, one constraint each (model policy, PR shape (independent off trunk, or stacked when the user asked), verification bar, forbidden paths, escalation policy). Paste it verbatim into every spawn and every resume. Directives decay across resumes, and each dropped one costs a human turn. When you catch yourself restating an instruction, append the line before you act (the **Encode Lessons in Structure** principle).
- `overview.md` is the durable PR and issue DB. Append. Never rewrite wholesale per event.
- `units.tsv` has one row per unit: id, track, state, branch, PR, head SHA, brief path. Update rows in place.
- `frontier.json` is the computed merge frontier, per Stack safety.
- `ledger.tsv` is the verification ledger, per Verification.
- `inbox/` holds completion pointers. `gates.md` parks human gates (question, options, default on no answer).
- `decisions.tsv` is the trail via the **show-me-your-work** skill.
- `status.md` is derived from `units.tsv` and `ledger.tsv` at each drain, never hand-maintained. Regenerate it from the tables instead of narrating events into it.

**The status board is an artifact, not prose.** After `orch init`, register `status.md` (notes), `units.tsv` (a table), and `ledger.tsv` (a table) once each with `berthd artifact add <file> --title "…"` per the **berth-artifacts** skill. Every `orch status` rewrites them, so the operator's board updates live. Outside berth, publish the status page with the `Artifact` tool at checkpoints, or paste the `orch status` lines and a markdown table of the open units in the reply.

#### The brief

Your prompts to agents are your only product, and a sloppy brief compounds into slop across the whole tree. Every spawn carries all of it. A field you cannot fill is a unit you have not scoped yet.

```
GOAL         one sentence, the outcome, executable by a stranger with no chat access
SCOPE        paths this unit may write; paths it may not; its exclusive worktree or branch
CONTEXT      pointers to files and PRs; upstream reports pasted in full when this unit
             depends on them, because workers cannot see siblings
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or the proof path (berth-browser, claude-in-chrome, Bash/tmux),
             plus known gotchas
TIMEBOX      rough cap on runtime; on expiry, return partial findings and stop rather than run on
FORBIDDEN    no PR retargets or merges, no rebase, no force-push, no fixes outside scope,
             plus unit-specific bans
REPORT       status, branch, head SHA, PRs, verdict, what you actually ran, deviations,
             suggested follow-ups
STANDING     <preferences.md pasted verbatim>
```

Size the brief to the unit. A one-command unit gets the template collapsed to a paragraph that still names goal, scope, the verify command, and the report shape. A 4KB scaffold around a two-line edit costs more to write and obey than the edit. Local subagents may reference the standing-orders file by store path. Verbatim paste is for berth tasks and every resume. Never put a secret in a brief, because a berth task's prompt is typed into a terminal the user reads.

A sub-coordinator brief adds its track boundary and unit list, its spawn budget with the berth default and the local exception list, the drain protocol, and the rollup format (per child: name, status, PR, head SHA, verdict, one line, plus track status and frontier delta).

A dependency is a context relay, not just ordering. Undeclared upstream context makes the worker guess. Missing fields are a refuse-to-spawn condition. Audit one sampled worker brief per sub-coordinator per wave, concurrently with the wave it samples, never as a gate in front of it. A failing brief stops that track and fixes the sub-coordinator's instructions, not just the worker, because brief quality decays late in a run. Never resume-chain a brief. Respawn fresh with consolidated scope.

#### Steps

1. **Frame.** State the done predicate as something countable ("all 126 units merged, each ledger-verified `unit-test-verified` or better"). Quantify scope: units, rough effort, expected PRs (independent off trunk, or stacks only when the user asked for them), and the wall-clock budget. If one agent could finish inside that budget, stop here and run Autonomous run instead. Collapsing must not depend on another document being present. It means do the work directly in this session, plain workers where they help, verification inline, landing as you go, and none of the store, register, or pilot machinery below. Schedule landing against the budget. By roughly 70% of it, stop spawning and land what is verified. Name the tracks per project. A contested decomposition or one-way door goes through the **arena** skill before the pilot. Present the framing once. Reversible prep proceeds without waiting.
2. **Install the runtime.** Run `orch init` and register the status board artifacts. Open the trail via the **show-me-your-work** skill, write the standing orders before any spawn, and seed `frontier.json` from existing PRs with `orch frontier set --repo <repo-dir>`.
3. **Pilot.** Push one unit through the whole path: brief, worker, verification, PR, ledger row, merge. The pilot exists to falsify the brief template, the verify recipe, and the unit size while that costs one agent instead of fifty. Fix the contract from pilot evidence before any fan-out. Scale the pilot to the unit. On programs of near-identical cheap units, the first unit is the pilot, run as a normal unit with its verify command inline, and fan-out starts the moment it lands. The dedicated pilot pipeline (separate verifier agent, audit gate) is for expensive or novel unit shapes, not for clone-units where a serialized pilot has nothing to falsify.
4. **Scale.** Spawn a rolling window of workers up to the in-flight cap, refilling as children finish. Spawn a wave's tasks in one message, then end your turn. Each reports back, and reports that land together arrive as one message. Blocking batches pay the slowest child of every batch. Spawn track sub-coordinators only past the one-drain threshold in Roles. Recompute ready work after each drain. Relay upstream reports into downstream briefs. Keep sibling communication upward only. The sampled brief audit runs alongside the wave it samples and stops the next refill on failure, not the current one.
5. **Drain.** Run the queue discipline below at every drain point.
6. **Land.** Landing is continuous, never a terminal phase. Integration starts with the first verified unit and runs alongside the remaining waves. Each verified unit lands as its own PR to trunk, merged with `gh pr merge` under the user's merge grant, per Roles. A unit that depends on an unmerged one waits for its parent to merge, then branches from trunk. When the user asked for stacks, the stacker is a standing role from wave one, integrating as units verify, and Stack safety governs. Keep the frontier green before upper-stack work. Advance `frontier.json` only on merge or reported new head SHAs.
7. **Close.** Drain the final inbox, reconcile every spawned agent to a terminal row (done, abandoned, zombie-reconciled), confirm the predicate on the real artifact, confirm every landed PR has a verdict for its current head SHA, audit the trail per **show-me-your-work** including its cross-model review, encode recurring corrections into `preferences.md` or the brief template. Leave the store intact. It is the postmortem.

#### Queue and drain

- On a completion (a `<berth-notification>` report, or an Agent tool completion), run `orch inbox push <agent> <unit> <status> [--report PATH]` and return to what you were doing. A berth report's `status` is `finished`, `waiting`, `exited`, or `lost`. `waiting` means the agent needs a person, so park it as a gate and tell the human who and why. Never answer for them. Never deep-review inline. A completion that needs review becomes a verifier unit. Never review a diff inside a drain.
- Drain in batches at four points: the end of a critical section, a track rollup, a frontier watcher wake, and before a human report. The frontier watcher is `watch-pr --queued-stack` (`~/.claude/skills/shipit/playbooks/babysit.md`) under the `Monitor` tool, or `gh pr checks <pr> --watch` as a background Bash command, with `/loop` on a long interval as the heartbeat fallback. Begin each batch with `orch inbox drain`. Arrivals during a drain wait for the next one.
- Critical sections you finish first: authoring a brief, a stack operation, a conflict decision, writing a gate, updating ledger or frontier.
- Each drain classifies every pointer (landed, needs-verify, failed, zombie, noise), writes the resulting rows through `orch unit add`, `orch unit set`, and `orch ledger record`, runs `orch status`, then spawns the next wave in one message.
- Account for every spawned child at its track's rollup: arrived, respawned, or its scope explicitly absorbed. Silently redoing a missing child's work hides both the wasted spend and the coverage gap its result existed to close.
- A drain turn ends with the three lines from `orch status`: counts against the states, what changed, gates open. Detail lives in `status.md` and the board artifacts. The full reply contract applies at checkpoints and close.

#### Stack safety

This section applies only when the user asked for stacked PRs. By default every unit is an independent PR off trunk, and none of the stack machinery below runs.

- The frontier is a computed object, never narrative. Recompute `frontier.json` after every merge and stack mutation: ordered PR list, branch names, head SHAs, a generation number, the lowest unmerged PR. The command walks the PR base chain through the checkout's current branch with `gh`, so chain order and PR states come from GitHub. Head SHAs come from local branch refs, so resolve it from the stacker's clone. A branch with no PR errors rather than guessing.
- Exactly one stacker per stack may mutate topology (chain rebases, force-pushes, base retargets, merges), serialized within its stack. Record the holder in the standing orders. Chain rebases run as a task (a berth task on a box when berth is available), never in the coordinator.
- Merged branches are not deleted in these repos, so GitHub never retargets a child PR when its parent merges. After every merge, the stacker retargets the next PR to trunk (`gh pr edit <pr> --base <trunk>`) and moves its patch onto trunk before that PR merges, per `~/.claude/skills/shipit/playbooks/shipping.md` step 4. A PR merged while its base is still its parent's branch lands in a dead branch.
- Workers never rebase and never retarget or merge PRs. Babysitters follow `~/.claude/skills/shipit/playbooks/babysit.md`, one per stack, scoped to one immutable frontier generation. They report conflicts to the stacker rather than rebasing.
- PR closes and retargets go through the stacker only. Closing a base PR orphans every chain above it. Merges and stack surgery are units with briefs like any other.
- One retro watcher follows merged PRs for reverts, post-merge CI breaks, and orphaned follow-ups.

#### Verification

Scale verification to the unit. When VERIFY is a single cheap command, the worker runs it and reports the output, and the coordinator spot-checks receipts, rerunning one where it doubts (`berthd exec <loc>/<wt> -- <cmd>` runs it in the worker's own worktree and env). A dedicated verifier agent (on a different model family than the worker) is for units whose verification is expensive, judgment-laden, or high-blast-radius. A verifier agent whose entire product would be rerunning one command is ceremony, not verification.

Write ledger rows with `orch ledger record`. Check the current PR and head SHA with `orch ledger check`. `ledger.tsv`, one row per verdict, keyed by PR number plus head SHA: `live-ui-verified | unit-test-verified | type-check-only | verifier-blocked | verifier-failed`. CI green is an input to a verdict, not a verdict. Behavioral work needs better than `type-check-only`. `live-ui-verified` needs screenshots (from **berth-browser** or **berth-visual-diff**, else **claude-in-chrome**) linked in the evidence. `verifier-blocked` is not a pass. Respawn when the environment heals. `verifier-failed` gets a fix unit, not a re-verify. A worker may self-report. A verifier overrides it on the same key. A new head SHA voids the row, so re-verify after restack. The ledger answers "was this verified", not memory and not the transcript.

A unit is not done until its output is externalized the moment it lands, never batched to the end of the run. A worker pushes its branch, a verifier writes its ledger row, receipts land in the store. Work that exists only in one worktree when that box or session dies was never done.

#### Liveness and failure

- Never prompt an agent to check on it. A `session send` starts a turn on an idle agent. Probe read-only: the ledger, `units.tsv`, `gh`, pushed branches, and on berth `berthd sessions --json` (`agent_state` is `idle`, `running`, `waiting`, or `finished`) and `berthd session turns NAME --json`. Read a screen (`berthd session screen NAME --history 40`) only when an agent is `waiting`. Transcript mtime is not liveness.
- A silent death gets a synthetic postmortem row in the inbox (unit, failure mode, last evidence, options). Replan on evidence as it arrives. Never wait for full quiescence.
- Retry by mode: cap-hit or oom, respawn with smaller scope. Network-drop, retry as-is. Tool-error, retry on a different model. Unknown, retry once. Two retries, then abandon the unit and replan around it. On berth, a retried send carries the same `--idem KEY`, so the box never types a prompt twice.
- A zombie that returns hours late reconciles against the current frontier and ledger before anything is accepted. Salvage unique findings through a fresh unit, never a blind merge.
- When continued spawning would produce garbage tree-wide (bad upstream output, broken acceptance, dead infra), write a stop line at the top of the standing orders, let in-flight work finish, fix the cause, clear it.
- Bound your own infra retries the same way you bound a child's. After a few consecutive tool aborts, stop retrying. Write a terminal handoff to durable state (what is done, where it lives, the exact command to resume) and end the run.
- After a Claude Code restart or a lost coordinator session: local Agent tool subagents are dead, berth tasks are not. Their reports went to the session that started them, so the new coordinator does not hear them. Re-read the standing orders and `units.tsv`, recompute the frontier, reattach berth work by PR and branch rather than agent id (`berthd sessions --json` shows each session's worktree and state, and a short `berthd session wait NAME --timeout 90s --json` tells you when one ends), respawn one sub-coordinator per track from its stored brief plus current state, drain, resume. The dead session's store lock clears itself on the next write. `orch` replaces a lock whose holder pid is gone.

#### Escalation

Reaches the human, batched into the status board rather than per item: irreversible actions (force-push to shared branches, deploys, deletions, closing someone else's PR), genuine product or preference calls no experiment settles, a standing order that contradicts observed reality, a program-level dead end that survived a replan, and any berth agent that is `waiting` on a person or any berth run that waits at a gate (`waiting_gate`, decided by the human with `berthd run approve|reject`). Park each as a `gates.md` entry before asking, and route work around it.

Never reaches the human: frontier nudges, rebase mechanics, retries, CI flake triage, review-thread triage, format fixes, scope the brief already forbids (refuse and continue), and "should I keep going". When in doubt, act and log.

Mid-run discoveries fix only what blocks the frontier. Everything else parks in follow-ups. At this fan-out a small scope leak multiplies into PRs nobody asked for.

**Reply:** at checkpoints and close: the predicate and the count against it from `units.tsv` and `ledger.tsv`, tracks and what each landed, the frontier (PR list plus SHAs), verdicts summary, what was abandoned and why, gates awaiting the human (the only asks), the store path, the trail path, and the link to the status board artifact. Numbers from the tables, not narrative. Include PR links.
