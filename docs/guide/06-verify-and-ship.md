# Verify the result and open a PR

"It compiles" is not evidence. The [Prove It Works principle](../../skills/shipit/principles/prove-it-works.md) makes the agent check the real artifact before it reports success, and your job is to make "the real artifact" checkable. This page covers stating a finish condition, showing the proof, vetting a measured number, generating a verification skill for your app, reviewing the diff, opening the PR, and driving it to merged.

Verification is the slowest step in most agent work, because it's the step that usually waits on a human. Make the agent able to do it, and you stop being the bottleneck. Skip it, and running more agents only gets you more unchecked work to review.

## State the finish condition up front

Put what done means in the first prompt, in whatever words fit:

```text
/shipit add json output to this command. text output stays byte-identical, the json parses, both run against the sample project. show me the evidence.
```

Now the agent has three checks it can run, not a mood to satisfy. When the reply comes back, it should carry the exact commands and outputs. If a check couldn't run, a good reply says "inconclusive", and you should treat a confident reply without evidence as a red flag.

Match the check to the change:

- A CLI change runs the real command. An interactive CLI or TUI gets driven through tmux (`tmux new -d`, `send-keys`, `capture-pane`).
- A UI change walks the changed flow in the running app. Inside berth, the **berth-browser** skill opens the worktree's own dev server in a headless browser, clicks through the flow, reads console errors, and takes screenshots at phone and desktop sizes. Without berth, the **claude-in-chrome** skill or the project's Playwright does the same.
- A change that can show on any page also gets a visual diff. Inside berth, the **berth-visual-diff** skill screenshots your worktree's pages and the main checkout's at phone, tablet, and desktop widths, and names every page that changed, where, and what broke. When the UI must match a reference pixel for pixel, the [Visual parity playbook](../../skills/shipit/playbooks/visual-parity.md) diffs screenshots against a frozen baseline instead of judging by eye.
- A parser or migration replays a saved input.
- A perf change compares before and after profiles.
- A storage change reads back the written value.

## Ask for proof you can see

Ask for the proof as an artifact you can inspect yourself: the failing test and then the passing one, the screenshots, the trace, the before-and-after number. If the fix already merged, ask for the same check again on main. An artifact beats a plausible explanation, because you can challenge it without replaying the whole run.

Inside berth, most of that proof lands in your Shipyard app on its own. A visual diff opens with a before-and-after slider and a heatmap. A number, a comparison, or a table of results becomes an artifact card through the **berth-artifacts** skill, and the agent rewrites the file to update it live. Outside berth, a result worth a page becomes a private claude.ai page through the `Artifact` tool, and anything smaller stays a markdown table in the reply. Either way, every chart and table says where its data came from (the command, the file, the run), so you can rerun it. A one-line answer doesn't need an artifact. The test is whether you'd rather look at it than read it.

For a small diff you don't fully trust, [`/blast-radius`](../../skills/blast-radius/SKILL.md) finds what it could break elsewhere. It picks the one fact the change is safe because of and proves it by running code instead of writing an essay about it.

## Vet a measured number with `/benchmark-checklist`

A before-and-after number is the easiest evidence to get wrong by accident. A warm cache, a debug build on one side, or work that never ran inside the timed region can each produce a convincing speedup. Before you report or act on a number, type:

```text
/benchmark-checklist vet the export speedup before it goes in the pr
```

[`/benchmark-checklist`](../../skills/benchmark-checklist/SKILL.md) asks seven questions and wants evidence from a run for each:

1. What limits the number, and why isn't it double?
2. Did every side run tuned the way production runs?
3. Does the result break a physical limit, like disk bandwidth or core count?
4. Did anything error or return wrong output?
5. Does it reproduce over alternating runs, with a median and a range?
6. Does it matter end to end, on the path a user waits on?
7. Did the work actually happen inside the timed region?

The verdict comes back as faster, slower, no measurable difference, or inconclusive, with the run count, range, and limiter. It says inconclusive when it can't name the limiter or a side ran untuned. `/shipit` already runs the checklist inside the Perf issue and Hillclimb playbooks, so you type it yourself when you measured something outside them, or when someone else's number looks too good. It's the working form of the [Explain the Number principle](../../skills/shipit/principles/explain-the-number.md).

## Create a project verification skill

The UI bullet above hides a real requirement. The agent needs a scripted way to drive your app. If your project has one, great. If not, run:

```text
/create-verification-skill
```

[`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md) interviews the repository, not you. It works out what a user touches, how the app launches locally, what can drive it (an existing harness first, otherwise a browser, a PTY, or plain HTTP), what evidence proves behavior, and whether two instances can run side by side. Inside berth, the browser driver is **berth-browser** on the worktree's own port, so two worktrees never collide. It asks you only what the code can't answer.

It writes `.claude/skills/verify-<app>/`, agent-facing instructions with exact Launch, Doctor, Drive, Evidence, and Cleanup sections, plus a feature map under `features/` that indexes what the app does and what result proves each feature works. The skill ships a [worked feature-map example](../../skills/create-verification-skill/references/feature-map-example/) with a README index and one file per feature using the four required H2s. Before handing it over, the generator proves the skill once end to end: launch, doctor check, drive one feature, capture evidence, clean up. If that proof fails, don't use the output.

From then on, "verify it in the app" is a step any agent can execute, in this repo, with no setup conversation. Name it in the prompt when you want the proof in a specific form:

```text
/shipit build the bulk-archive action. use /verify-acme to verify your changes and show me screenshots as proof.
```

```text
/shipit repro this with /verify-acme. if it repros on main, fix it and show me before and after screenshots as proof.
```

Once the verify skill works, a [`/swarm`](../../skills/swarm/SKILL.md) can split a full pass by feature-map entry and aggregate the results. A swarm of verifiers also confirms a perf win over a big enough sample, or fuzzes the app for regressions before a PR ships.

Treat the verification skill as infrastructure, not a one-off. Commit it, so every person and every agent on the team drives the app the same way. Then [build the lever](../../skills/shipit/principles/build-the-lever.md). When agents keep writing throwaway scripts to click through the app, ask for a small control CLI that the skill calls instead. Agents spend fewer tokens, and every run becomes repeatable. A CLI that agents use well has these traits:

- A few composable commands, each doing real work, rather than many thin ones.
- A `--dry-run` option on anything destructive.
- Subcommands that reveal features gradually instead of all at once.
- Error messages that say what to do instead.
- Rich `--help` text.
- Machine-readable output, such as JSON.

While you're there, make the dev setup repeatable too: seeded data, test users, and one command that brings the environment up the same way every time. On berth, that's the `setup` step and the per-worktree `env` in the repo's `.berth/config.json`, so every task's worktree starts ready to drive.

## Keep the verification skill honest

Apps change and feature maps rot. Run this at least once a day, ideally on a schedule so nobody has to remember (Claude Code's `/schedule`, or a cron job that starts a session):

```text
/maintain-verification-skill
```

[`/maintain-verification-skill`](../../skills/maintain-verification-skill/SKILL.md) audits the generated skill: one read-only source reader per feature in parallel, then one live pass that drives every mapped feature. It ends in exactly one of three outcomes. `clean` means full coverage and nothing to ship. `changed` means one PR of proven corrections, confined to the verification skill's own directory. `blocked` names the blocker. It never edits product code. If the live pass catches a product regression, it reports the regression instead of papering over it in docs.

## Review the diff before anyone else does

Run Claude Code's built-in `/code-review` on the diff before you open the PR. It looks for correctness bugs at the effort level you give it, from a few high-confidence findings (`/code-review low`) up to many (`/code-review max`), and `--fix` applies what it finds. It's the cheap local pass. For a contested or risky change, [`/interrogate`](../../skills/interrogate/SKILL.md) is the heavier one, with reviewers on different model families trying to break the diff.

Treat either one's findings the way you'd treat a review bot's. Some are real catches, some are noise. Check each against the code before you change anything.

## Open the PR

```text
/shipit open the pr. small ordered commits, evidence in the description.
```

The [Opening a PR playbook](../../skills/shipit/playbooks/opening-a-pr.md) works from a worktree, rebases the work into small ordered commits, cleans the diff with `/simplify`, unslops the prose, and returns the PR link. Screenshots and charts from the verification go in the description, so the reviewer sees the proof before the code. Five narrow PRs beat one fat one, and stacked follow-ups beat a growing branch.

## Drive the PR to merge-ready with Babysit

An open PR starts collecting blockers immediately. Checks fail, reviewers comment, trunk moves. Hand that churn to the [Babysit playbook](../../skills/shipit/playbooks/babysit.md):

```text
/shipit babysit this pr. get it green.
```

Babysit watches the PR through `gh` and takes blockers in order: conflicts, then review threads, then CI. It waits on checks without polling by hand, with `gh pr checks --watch` in a background shell or under `/loop`, and wakes when they settle. Every known fix batches into one push, so the checks restart once instead of after every fix. The comment triage is skeptical, because humans and review bots file real catches and noise in the same list. A real finding gets a fix, and noise gets dismissed with the disproof posted on the thread. When all you want is status, ask smaller and Babysit answers without starting the loop:

```text
/shipit check on pr 123. anything outstanding?
```

Babysit stops at merge-ready. It never merges, even with everything green, because merging is a different decision.

## Land the stack with Shipping

Green is not the same as safe. When you're ready to land, say so:

```text
/shipit land the stack.
```

The [Shipping playbook](../../skills/shipit/playbooks/shipping.md) verifies each PR independently before it arms anything. One fresh agent per PR proves the behavior live, and the agent that judges a change is never the one that wrote it. On a berth box, each verifier is its own berth task with the PR checked out in its own worktree. Then Shipping lands only the contiguous verified run from the bottom, one PR at a time through GitHub with `gh`, and reports the first PR that breaks the chain. A verified PR sitting above an unverified one waits, because merging it would pull the gap in underneath.

Next: [Run work while you sleep](./07-overnight.md).
