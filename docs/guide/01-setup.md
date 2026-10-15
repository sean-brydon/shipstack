# Set up shipit

In this page you install the skills, pick which models shipit uses, set Claude Code's permissions so long runs don't stall, and run your first task. Setup is one script plus a short conversation.

## Install the skills

Clone the shipit repository, then run its install script from the repo root:

```sh
./install.sh
```

It symlinks every skill into `~/.claude/skills/` and every agent (`shipit-agent`, `comment-sicko`) into `~/.claude/agents/`. Because they're symlinks, a `git pull` in the repo updates the next session. The script is safe to rerun. `./install.sh --dry-run` shows what it would do, and `./install.sh --uninstall` removes only the links that point into the repo. It never overwrites a real file or a link that points somewhere else, and it says which ones it skipped.

Start a new Claude Code session after installing, so the new skills are listed.

## Pick your models

Run:

```text
/setup-shipit
```

[`/setup-shipit`](../../skills/setup-shipit/SKILL.md) asks for a reasoning budget, shows you each role (code delegates, judgment, the review panels), and asks what you want. Answer the questions. It writes `~/.claude/shipit/models.md`, a small file the router and the routed skills read at the start of a task.

Claude Code sets a subagent's model and its effort separately. A role names a model family (`opus`, `sonnet`, `haiku`, or `fable`), and the budget sets the starting `effort` for every role:

| Budget | Starting effort |
|---|---|
| `unlimited` | `max` |
| `large` (default) | `xhigh` |
| `medium` | `high` |
| `small` | `medium` |

From that start, shipit raises effort one step for the hardest work, lowers it one step for judgment, and two for routine work. The family stays the one the role names, so a diverse panel stays diverse.

The defaults are Claude-first. Code delegates (feature, refactoring, bug fix, perf, hillclimb) and verification run on `sonnet`. Prose, judgment, and the hardest changes run on `opus`. The review panels mix families, for example `opus, sonnet, fable` for `/arena` and `/interrogate`.

You only override what you care about. A role with no line in the file keeps the default. To restore a default, delete that role's line. A rerun of `/setup-shipit` keeps any role you changed. When a default changes, a file written before the change still pins the old value, so delete those role lines, or the whole file, and run `/setup-shipit` again.

Two values aren't model families. `inherit` omits the subagent's `model`, so the role runs on whatever model your main session uses. `codex` is an opt-in second vendor. It runs `codex exec` read-only, or a berth task with `--agent codex` when you're on a box. For a panel role the value is a list, and one subagent runs per entry, so the list length sets the panel size. Setup also configures `swarm workers`, the default model for every `/swarm` worker unless a race names a model for each arm.

## Turn on auto mode

shipit spawns subagents, runs checks, and commits on branches. Under Claude Code's default permissions, each of those can stop at a prompt and wait for you. Run shipit in auto mode, where a classifier approves routine actions so the agent rarely stops, or give Claude Code a permission allowlist for the commands your checks run.

This matters most for long runs. An overnight run that hits a permission prompt at 1am sits there until you wake up. Auto mode doesn't remove the safety rails that count. Irreversible actions still pause for you whatever the mode: force-pushing a shared branch, deploying, deleting data, messaging customers, publishing.

[`skills/shipit/adapters/claude-code/auto-mode.md`](../../skills/shipit/adapters/claude-code/auto-mode.md) has what auto mode blocks and the settings worth adding.

## Use berth if you have it

shipit is built for berth (Shipyard), and it never requires it. When berth is available (a `BERTH_*` variable is set, `berthd` or `berth` is on your `PATH`, or the `mcp__berth__*` tools are listed), shipit prefers it:

- Parallel attempts each get their own berth task, with its own worktree, port, and environment, and report back when they finish.
- Proof on a page comes from the **berth-browser** and **berth-visual-diff** skills.
- Numbers, tables, and plans show up as artifacts in your Shipyard app through the **berth-artifacts** skill.

Without berth, the same steps fall back to plain Claude Code: subagents in their own git worktree, the **claude-in-chrome** skill or the project's own Playwright for the browser, and a markdown table in the reply.

## Accept the verification offer, or don't

At the end of setup, `/setup-shipit` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `.claude/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers it in depth.

If you're new to shipit, say yes. An agent that can check its own work keeps going until the check passes. An agent that can't hands every result back to you to check by hand. Of everything in this guide, the verification skill pays off the most.

## Keep the cost in check

shipit spends extra tokens on subagents and review panels. That's the price of the rigor. To spend fewer:

- Rerun `/setup-shipit` and pick a smaller budget, or cheaper families in the code roles. A strong model in the main session with `sonnet` or `haiku` in the code roles is a good split.
- Set a role to `inherit` so it runs on the session's own model.
- Shorten a panel list. Each entry runs one subagent.
- Save `/shipit` for work that needs rigor. A small, obvious edit doesn't.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/shipit add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/shipit` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. `/shipit` attaches to the message you send it with, and it fades as the chat moves on. To keep it applying for the whole session, say so:

```text
stay in shipit mode for the rest of this session.
```

For a run that should keep going for hours, pair it with Claude Code's `/loop`. [Run work while you sleep](./07-overnight.md) shows how.

Next: [Route work through `/shipit`](./02-shipit.md).
