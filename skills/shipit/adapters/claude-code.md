# Adapter: Claude Code

How each neutral term in shipstack maps to Claude Code. Read this after the router's first step when you are Claude Code. When berth is present, also read `berth.md` beside this file. Its steps replace the matching plain steps here.

## Where things live

| thing | path |
|---|---|
| `<skills>`, the folder that holds every shipstack skill | `~/.claude/skills/` (or `$CLAUDE_CONFIG_DIR/skills/`) |
| the project's skills folder | `.claude/skills/` in the repo |
| the shipit config folder (`models.md`, resume notes from the Pause safely playbook) | `~/.claude/shipit/` |
| subagent files (`shipit-agent`, `comment-sicko`) | `~/.claude/agents/`, linked from the repo's `agents/` by `install.sh` |
| saved memories | `~/.claude/projects/<slug>/memory/` (`MEMORY.md` is the index) |
| session transcripts | `~/.claude/projects/<slug>/*.jsonl` |
| settings, permissions and hooks | `~/.claude/settings.json`, and the repo's `.claude/settings.json` |
| a per-run scratch directory | the session's scratchpad directory when the system prompt lists one, else `${TMPDIR:-/tmp}/shipit/<run>` |

`<slug>` is the session's working directory with every non-alphanumeric character turned into `-`, so `/Users/you/proj` becomes `-Users-you-proj`.

## Neutral terms

| neutral term | in Claude Code |
|---|---|
| spawn a read-only helper | the `Agent` tool with `subagent_type: "Explore"`. Explore reads excerpts, not whole files. A reader that must read whole files (an explainer, a judge) uses `subagent_type: "general-purpose"` with "do not edit files" in its prompt |
| spawn a writing helper in its own worktree | the `Agent` tool with `subagent_type: "shipit-agent"` and `isolation: "worktree"` |
| the Comment Sicko helper (no-comments) | the `Agent` tool with `subagent_type: "comment-sicko"`. It is read-only by its own `tools` list |
| the delegate brief | the Agent tool's `prompt`. Point at files rather than inlining them. Put the router's absolute path (`~/.claude/skills/shipit/SKILL.md`) in every `shipit-agent` brief |
| end your turn; the helper reports back | Agent tool helpers run in the background and notify you when done. End your turn rather than polling |
| message a running helper | `SendMessage` with the helper's id or name. A new `Agent` call starts fresh |
| ask the user | `AskUserQuestion`: 1 to 4 questions per call, 2 to 4 options each, a recommended option first, `multiSelect: true` when several apply. More than 4 questions, or answers that don't fit options, go as plain numbered text in the reply with a recommended answer for each |
| the todo list | `TodoWrite`, or `TaskCreate` and `TaskUpdate` where that is what the session has |
| the role's model and effort | the Agent tool's `model` and `effort` params (see **Models and effort**) |
| an artifact | the `Artifact` tool (see **Artifacts**) |
| drive the real surface, take screenshots | the **claude-in-chrome** skill, or the project's own Playwright (see **The real surface**) |
| a visual diff against main | none built in. Paired screenshots side by side. With berth, `berthd shots compare` |
| the permission mode, "if a call is refused" | auto mode and its classifier (see **Auto mode**) |
| saved memories, the project's saved rejections | `~/.claude/projects/<slug>/memory/MEMORY.md` and the files it lists. Claude Code loads the index into every session. Standing rules also live in `~/.claude/CLAUDE.md` and the repo's `CLAUDE.md` or `AGENTS.md` |
| the session transcripts | `~/.claude/projects/<slug>/*.jsonl` (see **Transcripts**) |
| run your agent's simplify and review passes | `/simplify` on the diff; `/code-review` for a local review (see **Review passes**) |
| a repeating loop, a timed heartbeat | `/loop` (see **Waiting and watching**) |
| a stream watcher | the `Monitor` tool (see **Waiting and watching**) |
| a hook in your agent | a `hooks` entry in `settings.json` (see **Hooks**) |
| the cost receipt | `cost.py` (see **Cost receipt**) |
| tools that aren't loaded yet | deferred tools show by name only. Load them with `ToolSearch` (`select:<name>,<name>`, all you need in one call) before calling them |

## Helpers

- Spawn independent helpers in one message with several `Agent` calls, so they run at once. At most 5 at once (the router's cap).
- `shipit-agent` reads the router and this adapter before any work. Never spawn it to run a playbook. The chat that received `/shipit` runs the playbook.
- `isolation: "worktree"` gives the helper its own git worktree, cleaned up automatically if it made no changes. Its report names the branch. A worktree session can't write the main checkout. Bring the branch back instead.
- Routed skills (`how`, `why`, `interrogate`, `reflect`, `swarm`, `arena`, `architect`) name their helper kinds and roles. Map them with the table above.
- **A seat on another vendor.** A `codex` value runs that seat through Codex. Write the filled brief to a file, then run `codex exec -s read-only -C <repo root> -o <answer file> - < <brief file>` in Bash with `run_in_background: true`. A writing seat runs `-s workspace-write` in its own `git worktree add` checkout instead. The answer is in the answer file when the background task notifies you. With berth, a berth task with `--agent codex` also works (see `berth.md`). If `codex` is not on PATH, run the seat on the role's default and say so.
- **Listing running helpers.** The helpers and background shells you started this session report back through their notifications. Claude Code has no command that lists other sessions' agents. With berth, `berthd sessions --json` does. Without it, check processes (`ps`, `lsof -d cwd -Fn`) and the transcripts' modification times.
- **A candidate in its own directory** (the Eval playbook). Run `claude -p` from that directory so its transcript lands under that directory's own slug. `claude -p --model <family> --effort <level> --permission-mode plan "<brief>"` is a read-only run. `--permission-mode` also takes `acceptEdits`, `auto`, `dontAsk`, `manual` and `bypassPermissions`.

## Models and effort

`models.md` lives at `~/.claude/shipit/models.md`. Values are `opus`, `sonnet`, `haiku`, `fable`, `inherit` (omit `model` and run on the parent's model) and `codex` (opt-in second vendor, only when `codex` is on PATH). Panel roles take a list, one runner per entry. Set the Agent tool's `model` to the value. If the tool rejects a value, use the default and say so.

The neutral roles map to these lines. The playbook's own line wins for `code`.

| neutral role | `models.md` lines |
|---|---|
| `code` | `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb` |
| `hardest` | `hardest tasks` |
| `judgment` | `judgment and prose`, `how explainer`, `why synthesizer`, `reflect judgment, divergent, synthesizer` |
| `verification` | `verification` |
| `reading` | `how explorer`, `why investigators`, `recall readers`, `source readers` |
| other routine roles | `reflect tooling`, `automate-me miners` |
| panels | `arena runners`, `arena cross-judge pool`, `swarm workers`, `architect runners`, `interrogate reviewers` |

Defaults (a missing file or line means these):

```
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

A playbook that names the `code` role uses its own line (`bug-fix` for Bug fix, `feature, refactoring` for Feature and Refactoring, `perf-issue`, `hillclimb`). Any other code delegate uses `feature, refactoring`.

**Effort.** The Agent tool's `effort` param takes `low`, `medium`, `high`, `xhigh` or `max`. The budget line sets every role's starting effort: `unlimited` is `max`, `large` is `xhigh` (the default), `medium` is `high`, `small` is `medium`. At spawn time, raise it one step (up to `max`) for the hardest or subtlest work, lower it one step for judgment and two or more for routine work. Reading roles on `haiku` keep the starting effort, never lowered. Verification stays at its configured effort. Change only effort, never the family a role names. Setting `effort` because a skill says so is allowed, since the skill is the instruction.

**Why reading roles are on Haiku.** A blind eval (`docs/evals/2026-10-explorer-models.md`, 2026-10) ran three real `/how` questions through Haiku at `high`, Haiku at `xhigh` and Sonnet at `xhigh`. Haiku at `xhigh` scored 23.3 of 25, Sonnet at `xhigh` 21.0, Haiku at `high` 19.3. Haiku at `xhigh` cost about a fifteenth of Sonnet. So reading roles default to `haiku` and keep the budget's starting effort. Code delegates, verification and review panels stay on Sonnet or the panel mix.

A diverse panel means different families (`opus`, `sonnet`, `fable`, and `codex` when configured), plus different lenses where the skill gives them.

## Artifacts

Use the `Artifact` tool for anything worth a page. It publishes a private claude.ai page the user opens. Load the **artifact-design** skill before writing it, and the **dataviz** skill for any chart. Republishing the same file path updates the same page, so rewrite the file and publish again to update it live. When it isn't worth a page, use a markdown table or a Mermaid block in the reply. With berth, the berth adapter's artifacts replace this (they show beside the user's chat).

## The real surface

- **A page.** The **claude-in-chrome** skill drives the user's own Chrome. It opens tabs, reads the page, clicks and fills, reads console messages and network requests, runs JavaScript in the page (read `performance` entries that way), resizes the window, and takes screenshots. Load its tools with one `ToolSearch` call before use. Without it, use the Playwright setup the project already has.
- **Light and dark.** Toggle the theme the way the app does (its theme switch, or `prefers-color-scheme` emulation in Playwright) and shoot both.
- **Look at every shot.** `Read` the image file before you use it.
- **Open a page beside the user.** claude-in-chrome opens it in a tab of their own Chrome. Otherwise give the URL. With berth, `berthd preview`.
- **A visual diff against main.** No built-in. Shoot both sides at phone, tablet and desktop widths and put the pairs side by side in an artifact. With berth, `berthd shots compare`, including a named baseline (`--base turn-start`).
- **A CLI or TUI.** Bash, or tmux for interactive ones (`tmux new -d`, `send-keys`, `capture-pane -p`).
- **Per-attempt ports and env.** Without berth, give each worktree its own port. Pick one that is free (`lsof -i :<port>` prints nothing) and pass it as the env var the app reads.

## Waiting and watching

- **A background command.** Bash with `run_in_background: true`. You are told when it exits. Don't poll its output.
- **A stream watcher.** The `Monitor` tool runs a command and delivers each output line as an event (each CI check, each `ADVANCE` from `watch-pr --queued-stack`). Re-arm it when it expires.
- **Something you can't see** (CI on GitHub). `gh pr checks --watch` in a background Bash, or `Monitor`.
- **A repeating loop or timed heartbeat.** `/loop` with an interval (`/loop 30m <prompt>`), or without one to let the model pace itself. `/loop` and scheduled tasks inherit the session's permission mode, fire only while the session runs and is idle, and recurring ones expire after 7 days.
- **Session overrides.** `/goal` and `/loop` count as "keep going" grants under the router's Autonomy section.

## Auto mode

shipit expects Claude Code's auto permission mode. `adapters/claude-code/auto-mode.md` has what it blocks by default, how its classifier decides, and the recommended setup.

- A denied call is an answer. Don't retry it and don't route around it. Three denials in a row, or 20 in a session, pause auto mode until the human returns.
- The classifier reads the conversation, not tool results. Say in one line what you're about to do and why before an outward action.
- Merging a PR is blocked unless the user approved it in a message.
- Narrow allow rules (`Bash(go test *)`) survive auto mode. Broad ones (`Bash(*)`) are dropped on entering it. The **fewer-permission-prompts** skill builds the narrow list from the user's transcripts.

**Name your repos for auto mode** (setup-shipit runs this step). Auto mode judges pushes and PRs against the `autoMode.environment` lines in `~/.claude/settings.json`. Those lines are often generated from whatever folder Claude Code first ran in, and then say there is no trusted repo, so routine pushes get refused.

1. Run `python3 -I ~/.claude/skills/shipit/adapters/claude-code/scripts/automode_repos.py scan`. It lists the GitHub owners found in the user's local checkouts, marking the user's own account and the orgs they belong to.
2. Ask with `AskUserQuestion` (`multiSelect: true`) which owners auto mode should treat as the user's own source control. Offer up to four owners: the user's account first, then the orgs with the most checkouts. Put the rest in the question text so the user can name them under Other. Don't preselect an employer's org. Say what trusting it means (agents push branches and open PRs there without extra friction) and let the user choose.
3. Run the same script with `apply --owners <a,b> --dry-run` and show the user the old and new lines it prints. It rewrites only five lines (Organization, Repository visibility, Default / protected branches, Source control, Trusted repo) and leaves every other line and setting alone.
4. On the user's go, run it without `--dry-run`. It keeps a timestamped backup next to `settings.json`. Then run `claude auto-mode config` and confirm the new Source control line shows up. Changes apply to new sessions.

Skip this step when the user declines, or when `settings.json` has no `autoMode` section and the user doesn't want one. Never edit `settings.json` without the user's go.

## Transcripts

`adapters/claude-code/transcripts.md` has the full shapes, read off real transcripts: where each project's chats live, the subagent files under `<session-id>/subagents/`, the line types, the `jq` filter that keeps only the human's own turns, the filters for the agent's replies, tool calls, loaded skills and PRs, and the memory layout. Read it before you hand out transcript slices, and pass its path in each reader's brief.

- The current chat is `$CLAUDE_CODE_SESSION_ID.jsonl` when that variable is set.
- Order candidates by real modification time (`ls -t`), never by file name.
- Never read another project's directory unless the user asks. Don't glob across `~/.claude/projects/*/`.
- The resume note from the Pause safely playbook goes in `~/.claude/shipit/`.

## Hooks

Hooks live under `hooks` in `~/.claude/settings.json` (every project) or the repo's `.claude/settings.json` (committed with the repo). A `PreToolUse` hook on a tool (matcher `Bash`, `Edit`, …) gets the call as JSON on stdin (`tool_name`, `tool_input`). Exit 2 refuses the call, and what it prints on stderr reaches the agent. A `Stop` hook can refuse to end the turn until a check passes. The **update-config** skill writes them.

**The proof hook.** `adapters/claude-code/hooks/require-proof.py` refuses `gh pr create` when the PR body has no `## Proof` section with something under it. One line is enough for a nit. Turn it on with this under `hooks` in `~/.claude/settings.json`:

```json
"PreToolUse": [
  { "matcher": "Bash", "hooks": [ { "type": "command", "command": "python3 -I ~/.claude/skills/shipit/adapters/claude-code/hooks/require-proof.py" } ] }
]
```

Its cases run with `python3 -I skills/shipit/adapters/claude-code/hooks/require-proof.test.py` from the repo.

## Review passes

- `/simplify` reviews the changed code for reuse, simplification and efficiency, then applies the fixes. Run it on the diff before commit.
- `/code-review` reviews the diff, a PR number or a branch for correctness bugs at a given effort. Its findings arrive as a list. Triage every one per `references/review-bot-triage.md` before you pass `--fix`, which applies them all. `--comment` posts them as inline PR comments, which makes them PR threads.

## Cost receipt

`python3 -I ~/.claude/skills/shipit/adapters/claude-code/scripts/cost.py` prints what the current session and each of its subagents cost at list API prices, by agent and by model. Put its total line in the reply. Add its table as an artifact when more than a handful of agents ran. `--session <id>` picks another session, `--csv out.csv` writes the rows. Output tokens are a floor (hidden thinking isn't in transcripts), and on a subscription the dollars are usage, not a bill.

## Worktree audit

`scripts/worktree-audit.sh` in the shipit skill reads Claude Code transcripts from `~/.claude/projects` (`CLAUDE_PROJECTS` overrides the root) to fill its `LAST_CHAT` column. Its `BERTH` column is the ownership column the Worktree cleanup playbook names, and its `hold-berth-session` bucket means a live session owns the worktree. Without berth that column shows no owner, so check processes (`lsof -d cwd -Fn`) yourself.

## Skills and PRs

- **Skill frontmatter.** `name` and `description`. Add `disable-model-invocation: true` to keep a skill's description out of every session's context (it is then reachable only by reading its file or typing its slash command). `allowed-tools` grants permission for the skill's turn only. It doesn't restrict. The **skill-creator** skill helps where it is installed.
- **Typing a skill.** `/<name>` runs a skill, `/shipit <task>` the router.
- **PR attribution.** When the session's own instructions give an attribution line for PR descriptions (Claude Code's "Generated with Claude Code" line), end the PR body with it, after the Proof section.
