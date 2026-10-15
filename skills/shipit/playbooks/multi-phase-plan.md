### Multi-phase or multi-PR plan

**You own the plan, not the code. The plan is a checklist an owner runs box by box and the operator audits from the evidence.** The plan is the deliverable. Do not implement.

1. When the change is one or two files with an obvious approach, skip the plan. Say so and stop.
2. Settle open questions by prototype before you write. Run `~/.claude/skills/shipit/playbooks/prototype.md` for each. Keep the branch, the SHA, and the screenshots for Appendix A. Ask the operator only about a product or preference call that no run can settle. Give options (the **Never Block on the Human** principle, `~/.claude/skills/shipit/principles/never-block-on-the-human.md`).
3. Explore in subagents with `subagent_type: "shipit-agent"` and an explicit model per the Subagents section of `~/.claude/skills/shipit/SKILL.md` (the **Guard the Context Window** principle, `~/.claude/skills/shipit/principles/guard-the-context-window.md`). Pick each subagent's model and `effort` for the job, per the Subagents section. Each returns file pointers, conventions, test commands, and entry points. No inlined dumps.
4. Copy the skeleton below into the plan file and fill every placeholder. Unless the operator names a path, write the file to `~/.claude/shipit/plans/<program-slug>.md`. Keep every heading and every sub-block in the order shown. One section per PR. One PR is one change with its own evidence (the **Sequence Work into Verifiable Units** principle, `~/.claude/skills/shipit/principles/sequence-verifiable-units.md`). Name the execution playbook in **How to read this**. Pick between `~/.claude/skills/shipit/playbooks/autopilot-full.md` and `~/.claude/skills/shipit/playbooks/autopilot-stack.md` per the rule at the end of `~/.claude/skills/shipit/playbooks/autopilot-stack.md`. Plan a base-branch stack only when the user explicitly asked for one. Otherwise the PRs are independent off trunk, and a dependent PR waits for its parent to merge. A standing program takes `~/.claude/skills/shipit/playbooks/orchestrate.md`.
5. Write under the **technical-writing** skill in full, then the **unslop** skill. Read and follow `~/.claude/skills/technical-writing/SKILL.md` and `~/.claude/skills/unslop/SKILL.md`. The body is one Diátaxis mode, how-to. Appendices hold explanation and reference. Each heading states the task or the finding. No long dashes. No mid-sentence colons.
6. Run `node ~/.claude/skills/shipit/scripts/check-plan.mjs <plan.md>` and fix every line it prints (the **Encode Lessons in Structure** principle, `~/.claude/skills/shipit/principles/encode-lessons-in-structure.md`).
7. Hand back. Post the plan path and the script's output, then stop. Inside berth, also register the plan for the operator to read and approve beside the chat (`berthd artifact add <plan.md> --title "<Program> plan"`, per the **berth-artifacts** skill). Execution starts on the operator's explicit go, under the execution playbook the plan names.

**Verification.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked (the **Prove It Works** principle, `~/.claude/skills/shipit/principles/prove-it-works.md`). That sentence is the verification rule. Every verification block opens with it. The live block is mandatory. Ten lanes at the PR head, at most 5 running at once (the router's cap, or the user's) with the rest queued, drive the real surface through its proof skill, per the **swarm** skill, on the `swarm workers` model (default `sonnet`). Each lane is one box with a concrete scenario, the screenshot it saves, and its pass predicate. One lane is the **Regression lane against trunk.** It runs the same load-bearing scenario on trunk and head. If trunk does not have the feature, the lane records that fact and gates the behavior the diff adds plus the end state the user waits for instead of inventing a trunk result. The perf gate is dual-sided. Trunk and head must both produce the named metric. If trunk lacks the feature, also isolate the work the diff adds and set an absolute budget for that work plus the end-to-end state the user waits for. Do not claim a ratio between unlike scenarios. The perf block names the metric, the interleaved probe, the trunk baseline measured first, and the rule with the number that fails. A PR that changes an interaction is review-gated. The operator reviews it in chat with screenshots and a video before merge. A PR that changes no interaction writes `**Review gate.** None. <PR id> is not review-gated.` and no boxes under it.

**Proof skill.** Pick it by surface. Browser and web UIs use the **berth-browser** skill in a berth worktree (with **berth-visual-diff** for before and after across widths), else the **claude-in-chrome** skill or the Playwright the project already has. Electron and desktop apps use the driver the repo has (Playwright, a CDP script). CLIs and TUIs use Bash, or tmux (`tmux new -d`, `send-keys`, `capture-pane`) for interactive ones. Native mobile uses whatever simulator-driving skill or script the repo has. A PR that touches two surfaces gets lanes on both. A surface with no driver is a risk in Appendix C, and its live block still names how each lane drives it.

**Stacked PRs.** Merged branches are not deleted in these repos, so GitHub never moves a stacked PR onto trunk when its parent merges. A PR merged while its base is still its parent's branch lands in a dead branch. A plan stacks only when the user explicitly asked for a stack. Every plan whose execution playbook stacks carries the retarget box in PR mechanics and in each Merge block.

````markdown
# <Program> plan

<Under ten lines. What changes, for whom, the rule the program enforces, and the PR ids in order.>

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `~/.claude/skills/shipit/playbooks/<execution playbook>.md`. <Who merges, and which PR ids are the operator's items that stop at merge-ready.>

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Read these at program start. Re-read them at every tick.
  - [ ] `cat ~/.claude/skills/shipit/playbooks/<execution playbook>.md`
  - [ ] `cat ~/.claude/skills/swarm/SKILL.md`
  - [ ] `cat ~/.claude/skills/<proof skill>/SKILL.md`
  - [ ] `cat ~/.claude/skills/shipit/playbooks/opening-a-pr.md`
  - [ ] `cat ~/.claude/skills/<each other leaf skill the program uses>/SKILL.md`
- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from disk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail and rewrite the program table artifact. The row names the items reported, or none."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names. Inside berth, each owner is a berth task (`berthd task new <loc>/<pr-slug> --base <base-branch> --agent claude --prompt "<brief>"`). Otherwise each is an Agent tool subagent with `isolation: "worktree"`.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges. Base it on the parent branch only when the user asked for a stack.
  - [ ] <PR id> and <PR id> are independent and first. Both branch from `main`.
  - [ ] <PR id> after <PR id>.

```mermaid
graph BT
  <PR id> --> <PR id>
```

- [ ] Hold the file boundaries. <PR id or class> touches only `<glob>`.
- [ ] Hold the review gate. <PR ids> change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Use `gh` for every PR operation. Never require `gt`.
- [ ] Open the PR ready, never draft, per **Opening a PR**, with `gh pr create --base <base-branch>`. A stack child targets its parent branch.
- [ ] Run the repo's lint and typecheck once before the PR-facing push. Push with hooks on.
- [ ] Run `/simplify` before each commit. Before review, read and follow `~/.claude/skills/no-comments/SKILL.md`.
- [ ] Give the PR body its Proof section per **Opening a PR**, with the checks table and the lane screenshots, light and dark for UI.
- [ ] Triage every review-bot and security-reviewer comment per `~/.claude/skills/shipit/references/review-bot-triage.md`.
- [ ] Merge current trunk into the branch (`git merge origin/main`) and push before the code-ready report and babysit. No force push. Keep that merge base in fix rounds. Update again only at merge prep, on a `git merge-tree` conflict with trunk, or on a CI failure that comes from a change on trunk.
- [ ] After a parent PR merges, retarget its child to trunk (`gh pr edit <pr> --base main`) and move its patch onto trunk before the child merges. Merged branches are not deleted, so a child left on its parent's branch merges into a dead branch.

### Verdict and merge, for every PR

- [ ] A full swarm runs once, at the code-ready head. Another full swarm runs only for new behavior, a redesign, or a large new diff. A rebase, a merge-conflict resolution, or a minor fix gets a single verifier at the new head. Run each full swarm per `~/.claude/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block, at most 5 running at once with the rest queued. The perf lane from its **Verify, perf** block. Two or more audit lanes, each with its own focus, that read the diff and the receipts and distrust the PR body. The root audits the receipts in the merge-ready report before the verdict.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner, including a defect that a lane filed as a note. A new head gets a fresh verdict, except for results that stay valid under the patch-id rule in `~/.claude/skills/shipit/playbooks/shipping.md`.
- [ ] Keep the program table artifact current, one row per PR with its head SHA, verdict, and merged state.
- [ ] <The merge or append rule from the execution playbook, with the patch-id rule from `~/.claude/skills/shipit/playbooks/shipping.md`.>

### Boot recipe, for every live lane

Each live lane runs at the PR head in a worktree of its own, never on the head branch the owner holds. In berth that is a task on its own branch from the head (`berthd task new <loc>/verify-<pr-id>-<n> --base origin/<head-branch> --agent claude --prompt "…"`). Without berth it is a detached checkout (`git worktree add --detach <path> origin/<head-branch>`). Lanes may also share one berth worktree with its own browser tab (`--tab lane-<n>` on every `berthd browser` command) when lanes write no shared state. Without berth, each lane is an Agent tool subagent in its own detached checkout. Drive through the proof skill.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] <Start the backend and the surface on the worktree's own port (`$BERTH_PORT` in berth). Wait for ready.>
- [ ] <Deliver input only through the proof skill's commands. Name the read-only diagnostics.>
- [ ] Save every screenshot under the session's scratchpad directory when the system prompt names one, else under `~/.claude/shipit/runs/<program-slug>/swarm-<pr-id>/worker-<n>/<slug>.png`, and return the paths with the report. Shots the operator sees go on the `pr-assets` branch or in an artifact.

## <Task as a verb phrase> (<PR id>)

**Depends on.** <PR id, or None.>

**Files.**

- [ ] Edit `<path>`.
- [ ] Create `<path>`.
- [ ] Delete `<path>`.

**Build.**

- [ ] <One change. Name the symbol and the file.>

**You see.**

- [ ] <One observable result, with the exact log line or screen state.>

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] <Test file and the case it gains.> Run `<command>`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `<swarm workers model>` at the PR head, per the boot recipe. At most 5 run at once, and the rest queue.

- [ ] Lane 1. Regression lane against trunk. Run <the same load-bearing scenario> at trunk and head. If trunk lacks the feature, record that and gate <the behavior the diff adds plus the end state the user waits for>. Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 2. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 3. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 4. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 5. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 6. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 7. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 8. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 9. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 10. <Scenario.> Save `<slug>.png`. Pass when <predicate>.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. <What is measured at both trunk and head. If trunk lacks the feature, also name the diff-added work and the end-to-end state the user waits for.>
- [ ] Probe. <The command or procedure, run at trunk and at the head, interleaved. Both sides must produce the metric.>
- [ ] Baseline. Record the trunk <value> first.
- [ ] Rule. <Head against trunk, with the number that fails. If the scenarios differ, add absolute budgets for the diff-added work and the user-visible end state instead of an invalid ratio.> Chart trunk against head as a `berth.chart` bar with `better` set, or a markdown table outside berth.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane <n> screenshots, light and dark, into `<media path>/<pr-id>-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the change on a lane worktree (a screen recording, or a GIF from the **claude-in-chrome** skill). Save it as `<media path>/<pr-id>-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Review-bot triage done.
- [ ] Updated from current trunk after the verdict (`git merge origin/main`), patch-id unchanged.
- [ ] Base reads `main` (`gh pr view <pr> --json baseRefName`). If the parent merged, retarget first.
- [ ] <The owner squash-merges its own PR, or, only when the user asked for a stack, the root appends it to the base-branch stack and the operator lands it bottom-up, retargeting each link to `main` after the one below it merges.>

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

<Each open question a prototype answered, with the branch, the SHA, and the artifact links. Each question that stays unproven.>

## Appendix B. Alternatives rejected

<Each approach weighed and why it lost.>

## Appendix C. Risks

<Each risk with the PR it lands in and what the owner watches.>

## Appendix D. Links and reading list

<Docs to read before editing. Which PRs get `~/.claude/skills/how/SKILL.md` and `~/.claude/skills/interrogate/SKILL.md`. The trail per `~/.claude/skills/show-me-your-work/SKILL.md`.>
````

**Reply:** the plan path (and its artifact link inside berth), the PR ids with their dependencies and the review-gated set, what the prototypes proved and what stays unproven, and the check script's output.
