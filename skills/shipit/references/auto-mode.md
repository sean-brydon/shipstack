# shipit under auto mode

Notes from the Claude Code docs (code.claude.com/docs/en/permission-modes, /auto-mode-config, /permissions, /sub-agents, /scheduled-tasks, /worktrees, /skills, /best-practices), read 2026-10-14. These shape the router's Autonomy section and the long-run playbooks.

## How it decides

- Order, first match wins: allow/ask/deny rules; then read-only actions and edits inside the working directory are approved; then everything else goes to a classifier model; a block returns the reason to the agent.
- The classifier sees user messages, non-read-only tool calls, CLAUDE.md and the `autoMode` prose rules. It does not see tool results. So the reason for an action has to be in the conversation (the user's ask, the plan), not buried in a tool output.
- Subagents are checked at spawn (the task description), on each action, and on their final report.

## What it blocks by default

Force push, `git reset --hard`, `git checkout -- .`, `git clean -fd`, `git stash drop`, prod deploys and migrations, mass cloud deletion, IAM grants, secret-manager writes, merging unapproved PRs, piping curl to a shell, sending sensitive data out, `git remote add/set-url` unless named, writes to transcript `.jsonl` files. Pushes and PRs to the working repo are allowed.

## What this means for shipit

- **A denied call is an answer, not an obstacle.** Don't retry it, don't route around it with an equivalent command. Record the block (decision log), skip or stop that step, report it with the reason. Three blocks in a row, or 20 in a session, pause auto mode and wait for the human, which kills an overnight run.
- **Prefer reversible forms** so the classifier never has to say no: `git stash` over `git checkout -- .`, `git worktree remove` after checking it is clean over `rm -rf`, a new commit over a reset, `--force-with-lease` on your own branch only.
- **State intent before acting.** Because the classifier reads messages, not tool results, a one-line "pushing branch fix/x to open the PR" before the push gives it the context.
- **Merging a PR is blocked unless approved.** Shipping and autopilot-full land only PRs the human approved or explicitly told shipit to merge, in a user message.
- **Long runs close their own loop.** Every autonomous run names a check that returns pass/fail (tests, build, screenshot diff) and a fresh-context verification subagent told to "report gaps, not style preferences".
- **`/loop` and scheduled tasks** inherit the session's mode, fire only while Claude is running and idle, and recurring ones expire after 7 days. Overnight work needs the session left open (or a berth task on a box, which outlives the laptop session).
- **Worktree sessions can't write the main checkout.** A delegate in a worktree that needs to change main is a design smell. Bring its branch back instead.
- **Background sessions waiting on a permission prompt sit in "Needs input"** and nothing auto-denies. A fleet should be started in auto mode so it doesn't stall.
- Skill `allowed-tools` grants permission for that turn only. It doesn't restrict.

## Recommended setup (for the user, not done automatically)

- Run `claude auto-mode config` and set `autoMode.environment` (in `~/.claude/settings.json`, with the literal `"$defaults"` kept) to name the GitHub org and repos you push to, so pushes and PRs there read as trusted.
- If you want rebase flows, allow force pushes to your own feature branches in the `autoMode.environment` or allow prose ("`git push --force-with-lease` to my own feature branches in acme/web is routine"). Without it, auto mode blocks every force push, and shipit updates PR branches with `git merge origin/<trunk>` instead.
- Narrow allow rules for routine checks (`Bash(go test *)`, `Bash(pnpm test)`) survive auto mode. Broad ones (`Bash(*)`) are dropped on entering it. The **fewer-permission-prompts** skill builds the narrow list from your transcripts.
