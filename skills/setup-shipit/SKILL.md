---
name: setup-shipit
description: Configure which model shipit uses per role and at what reasoning budget, and detect codex and berth. Writes ~/.claude/shipit/models.md, which overrides the skill defaults. Use for /setup-shipit, "configure shipit models", "shipit budget", or changing shipit's model choices.
---

# Setup shipit

Write `~/.claude/shipit/models.md`, the file the **shipit** skill and its routed skills read at task start to pick a model per role. A missing file or a missing line means the default.

## Steps

### 1. Detect what is available

- **Claude models.** The `Agent` tool's `model` takes `opus`, `sonnet`, `haiku` and `fable`. Those are the families. There is nothing to probe. Effort is a separate `effort` param, set from the budget.
- **codex (opt-in second vendor).** Run `command -v codex`. When it is on PATH, `codex` is a valid value for any role: that role runs `codex exec -s read-only` in Bash, or a berth task with `--agent codex` on a box. When it is not, never write `codex`.
- **berth.** Check `command -v berth berthd`, `env | grep '^BERTH_'` (names only, never print values), and whether `mcp__berth__*` tools are listed. berth needs no line in the file. The skills detect it at run time and use berth tasks, the agent browser and artifacts when it is there. Report what you found, because it changes how panels run (a berth task per runner, each in its own worktree) and how proof is captured.

The alias `inherit` is always valid: the role runs on the parent chat's model (omit `model`).

### 2. Load current state

The default role-to-model mapping is the file shape in step 5. If `~/.claude/shipit/models.md` already exists, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from the defaults. A line whose role is not in step 5 is from a retired role. Drop it.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Use `AskUserQuestion` with these four options and these exact labels, and name the current budget when the file records one. With no file, say that `large` matches the skill defaults.

- `unlimited (max effort)`
- `large (xhigh effort)`
- `medium (high effort)`
- `small (medium effort)`

**(b) Apply it.** The budget sets the starting `effort` for every role: `unlimited` → `max`, `large` → `xhigh`, `medium` → `high`, `small` → `medium`. It does not change any model value. At spawn time each skill raises effort one step for the hardest work, lowers it one step for judgment and two for routine work, per the Subagents section of the **shipit** skill. On a re-run, keep any role whose value differs from the default.

**(c) Show the roles and confirm.** Show every role with its value as a table, and list each line step 2 dropped. Then ask with `AskUserQuestion` whether to accept as-is or change roles. For changes, take the role names and new values in the user's words, or ask per role with `AskUserQuestion`. It takes 2 to 4 options per question, so offer `opus`, `sonnet`, `fable` and `haiku` as the options, and name `inherit` (and `codex` when step 1 found it) in the question text as answers to give through its free-text Other choice. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one runner spawns per entry, so the list length sets the count. A diverse panel means different families. Suggest adding `codex` to a panel when step 1 found it. `arena cross-judge pool` is also a list, but arena picks one value from it whose family differs from the parent's when it can. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every value written is one of `opus`, `sonnet`, `haiku`, `fable`, `inherit`, or `codex` (only when step 1 found it on PATH). If a chosen value fails, stop and ask again.

### 5. Write the file

`mkdir -p ~/.claude/shipit`, then write `~/.claude/shipit/models.md` with a `# budget` line naming the chosen budget and its effort, and one line per role, using the same labels the shipit skill uses. Overwrite the whole file so re-runs stay idempotent. Shape, with the defaults:

```
# shipit model configuration. One line per role. Delete a line to fall back to the default.
# Values: opus, sonnet, haiku, fable, inherit (run on the parent's model), codex (opt-in, needs codex on PATH).
# Panel roles take a list, one runner per entry.
# budget: large (xhigh)
feature, refactoring: sonnet
bug-fix: sonnet
perf-issue: sonnet
hillclimb: sonnet
judgment and prose: opus
hardest tasks: opus
how explorer: haiku
how explainer: opus
why investigators: haiku
why synthesizer: opus
reflect tooling: sonnet
reflect judgment, divergent, synthesizer: opus
arena runners: opus, sonnet, fable
arena cross-judge pool: opus, fable
swarm workers: sonnet
verification: sonnet
architect runners: opus, sonnet
interrogate reviewers: opus, sonnet, fable
recall readers: haiku
source readers: haiku
automate-me miners: sonnet
```

### 6. Confirm

Tell the user the file was written, show the final table, and say that skills read it at the start of each task, so it applies from the next task on. Re-running this skill updates it. When a default changes in a later shipit version, a file written before the change still pins the old value. Delete that line, or rerun this skill, to pick up the new default.

Then mention permissions once. Long runs (autonomous run, autopilot, orchestrate, `/loop`) work best in Claude Code's auto permission mode, or with an allowlist so routine commands don't stop the run. The `fewer-permission-prompts` skill builds one from the user's own transcripts. Irreversible actions (force-push to shared branches, deploys, data deletion, messages to customers, publishing) still pause for the human in any mode.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `.claude/skills/verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." Say which harness it would use: the berth agent browser when step 1 found berth, else the project's Playwright or claude-in-chrome. On yes, run the **create-verification-skill** skill (`~/.claude/skills/create-verification-skill/SKILL.md`). On no, move on without pushing.
