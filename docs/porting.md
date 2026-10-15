# Porting pstack to shipit

shipit is a Claude Code adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (MIT). This file is the contract for porting a pstack file to shipit, and for re-syncing later.

Upstream pinned at `cursor/plugins@1e5c90a4b6f249917bd21fe361b3a2a7deb741b8` (2026-10-14).

## Goal

Keep pstack's substance: the rigor, the playbooks' steps, the principles, the review panels, the writing rules. Change only what is Cursor-specific, so it runs in Claude Code, and add berth (Shipyard) where berth does the job better. Do not water it down or summarize it. A playbook step that still makes sense stays, word for word where possible.

## Layout

```
~/personal/shipit/                    the repo
  skills/<name>/SKILL.md              each one is installed to ~/.claude/skills/<name>
  skills/shipit/SKILL.md              the router (pstack's poteto-mode)
  skills/shipit/playbooks/<p>.md      the playbooks
  skills/shipit/principles/<p>.md     the principles (NOT separate skills, see below)
  skills/shipit/references/           shared references
  agents/<name>.md                    installed to ~/.claude/agents/<name>.md
  docs/                               the guide and this file
  install.sh                          symlinks skills and agents into ~/.claude
```

Installed paths are stable. Reference other files by installed path:

- the router: `~/.claude/skills/shipit/SKILL.md`
- a playbook: `~/.claude/skills/shipit/playbooks/<name>.md`
- a principle: `~/.claude/skills/shipit/principles/<name>.md` (no `principle-` prefix, e.g. `principles/prove-it-works.md`)
- another skill: the **<name>** skill, file `~/.claude/skills/<name>/SKILL.md`

Inside a skill, its own files are referenced relative to that skill's folder (`references/x.md`), as pstack does.

## Names

| pstack | shipit |
|---|---|
| pstack | shipit |
| `poteto-mode`, `/poteto-mode`, "poteto mode", "poteto's style" | `shipit`, `/shipit`, "shipit mode", "shipit's style" |
| `poteto-agent` (subagent) | `shipit-agent` |
| `comment-sicko` | `comment-sicko` (unchanged) |
| `poteto-help` | `shipit-help` |
| `setup-pstack` | `setup-shipit` |
| `principle-<x>` skill | principle file `principles/<x>.md`; call it "the **<Title>** principle" |
| poteto, "i" (the author's voice) | drop the persona. Write as the stack. Credit lives in README only. |

Every other skill keeps its pstack name (`how`, `why`, `arena`, `swarm`, `interrogate`, `architect`, `tdd`, `unslop`, ...).

Principles are files, not skills, because Claude Code lists every skill's description in every session's context. 24 principle skills would cost context in every chat. The router indexes them inline and the leaf is one Read away.

## Claude Code mapping

| Cursor / pstack | Claude Code |
|---|---|
| `Task` tool | `Agent` tool |
| `subagent_type: "generalPurpose"` | `subagent_type: "general-purpose"` |
| readonly explore subagent | `subagent_type: "Explore"` (read-only) |
| `run_in_background: true` | Agent tool subagents run in the background and notify on completion. End your turn instead of polling. |
| `model: "<slug>"` with effort baked into the slug (`claude-opus-5-5-xhigh`, `grok-4.7-xhigh-fast`) | `model: "opus" | "sonnet" | "haiku" | "fable"` plus a separate `effort: "low"|"medium"|"high"|"xhigh"|"max"`. "fast" has no per-subagent equivalent; drop it. Omitting `model` inherits the parent. |
| `AskQuestion` | `AskUserQuestion` |
| todo list | the todo/task list tool (`TodoWrite`, or `TaskCreate`/`TaskUpdate` where that is what the session has) |
| Cursor custom mode (option+enter, persistent) | No equivalent. `/shipit` attaches to one message; the user can say "stay in shipit mode" and the skill keeps applying. Mention `/loop` for long runs. |
| Cursor `/loop` | Claude Code `/loop` (same idea: interval or self-paced) |
| `/create-skill` (Cursor built-in) | Claude Code skill conventions: `SKILL.md` with `name`, `description` frontmatter; optional `disable-model-invocation: true`, `allowed-tools`. The `anthropic-skills:skill-creator` skill if installed. |
| `deslop` (cursor-team-kit) | the built-in `/simplify` (quality cleanup of the diff) |
| review bots / Bugbot | `/code-review` for a local review; external PR bots (Bugbot, CodeRabbit, Copilot, Claude review) stay generic: "review bots" |
| `control-ui` (cursor-team-kit) | the **berth-browser** skill inside a berth worktree, else the **claude-in-chrome** skill |
| `control-cli` | drive the CLI or TUI with Bash, or tmux (`tmux new -d`, `send-keys`, `capture-pane`) for interactive ones |
| Cursor cloud agents / background agents | berth tasks on a box (`berthd task new`), see the **berth-orchestrate** skill |
| Cursor agent transcripts (`~/.cursor/...`) | Claude Code transcripts: `~/.claude/projects/<cwd-slug>/*.jsonl` (cwd with every non-alphanumeric character replaced by `-`, see `~/.claude/skills/recall/references/transcripts.md`) |
| `~/.cursor/rules/pstack-models.mdc` (always-applied rule) | `~/.claude/shipit/models.md`, read by the router and the routed skills at task start |
| `~/.cursor/plugins/**/skills/poteto-mode/SKILL.md` lookup | `~/.claude/skills/shipit/SKILL.md` |
| Origin CLI (landing stacks) | `gh` only |
| Cursor docs / Cursor-only features (Grok Bot, Cursor Automations, Bugbot settings, Cursor marketplace) | drop, or generalize if the idea stands without them |

## Models

Claude-first. Roles and defaults (`setup-shipit` writes overrides to `~/.claude/shipit/models.md`; a missing line means the default):

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

- Values: `opus`, `sonnet`, `haiku`, `fable`, `inherit` (omit `model`, run on the parent's model), or `codex` (opt-in second vendor: run `codex exec` read-only in Bash, or a berth task with `--agent codex` when on a box). Panel roles take a list; one runner per entry.
- Budget sets the starting `effort` per role: `unlimited` → max, `large` → xhigh (default), `medium` → high, `small` → medium. Raise one step for the hardest work, lower one step for judgment and two for routine work, exactly as pstack's "Match the model to the job" says, but by changing the `effort` param, not a slug.
- The Agent tool's `effort` param is set because a skill tells you to. That is allowed: the skill is the instruction.
- A diverse panel means different model families (opus / sonnet / fable, and codex when configured), plus different lenses where pstack gives them.

## berth (Shipyard)

shipit is for berth. When berth is available (any `BERTH_*` env var set, or `berthd`/`berth` on PATH, or the `mcp__berth__*` tools are listed), prefer it:

- **Isolated parallel work** (arena runners, prototypes): a berth task per attempt (`berthd task new <loc>/<name> --agent claude --prompt "…"`, or the `berth_task_new` / `berth_attempts` MCP tools). Each gets its own worktree, port and env, and reports back with a `<berth-notification>`. End your turn, don't poll. See the **berth-orchestrate** skill. Without berth, use the Agent tool with `isolation: "worktree"`.
- **Proof on a page**: the **berth-browser** skill (headless browser on the worktree's own dev server), the **berth-visual-diff** skill (before/after across widths), the **berth-preview** skill (show the user the page). Without berth: **claude-in-chrome**, or Playwright the project already has.
- **Showing results** (a table over ~8 rows, a before/after number, a hillclimb log, a plan to approve): the **berth-artifacts** skill. Without berth: a markdown table in the reply.
- **Checks in a worktree**: `berthd exec <loc>/<wt> -- <cmd>`.
- **Encoding a lesson as a gate**: the **berth-hooks** skill (a `before:` hook can refuse an action) sits next to lint, types, CI.
- **Waiting**: berth notifications and Claude Code's background-task notifications replace pstack's polling scripts. For an external thing neither can see (CI on GitHub), `gh pr checks --watch` in a background Bash, or the `Monitor` tool, or `/loop`.

Never make berth required. Every berth step has a plain Claude Code fallback in the same sentence or the next.

## Evidence you can see

The owner of shipit works from evidence: artifacts, charts and data that back a claim. This is a first-class rule, stronger than in pstack. Wherever a pstack file reports a number, a comparison, a before/after, a timeline, a coverage matrix, a decision log, a dependency graph or a plan to approve, the shipit version produces a visible artifact, not only prose:

- Inside berth: the **berth-artifacts** skill (berth.chart JSON, CSV, Mermaid, Markdown or one HTML page, registered with `berthd artifact add`, updated live by rewriting the file). UI proof: screenshots from **berth-browser** / **berth-visual-diff**.
- Outside berth: the `Artifact` tool (a private claude.ai page; load the **artifact-design** skill first, and the **dataviz** skill for any chart) when the result is worth a page, else a markdown table or Mermaid block in the reply.
- Every chart or table states where its data came from (the command, the file, the run) so a reader can rerun it.
- Don't make an artifact for a one-line answer. The test: would the user rather look at it than read it?

## Permission modes

shipit should run well under Claude Code's auto mode (the classifier approves routine actions, so the agent rarely stops). Long runs (autonomous run, `/loop`) assume auto mode or a permission allowlist. Irreversible actions (force-push to shared branches, deploys, data deletion, messages to customers, publishing) still pause for the human, whatever the mode. `skills/shipit/references/auto-mode.md` has what auto mode blocks and how shipit behaves under it.

## Writing

- Keep pstack's writing rules (short declarative sentences, no long-dash character, no colon as a mid-sentence connector, evidence or label on every claim). They are part of the stack.
- Keep frontmatter minimal: `name`, `description`. Keep `disable-model-invocation: true` where pstack has it. Drop Cursor-only keys (`icon`, `color`, `is_background`). Agents use Claude Code agent frontmatter: `name`, `description`, optionally `tools`, `model`.
- Descriptions say what it does and when to use it, in one or two sentences. Claude Code shows every description in every session, so cut any clause that does not help pick the skill.
- Don't invent features. If a Claude Code or berth capability is not in this file or in a skill you read, don't claim it.
- Nothing company-specific (no employer names, no Cursor-internal names, no real customer names). Use "acme" for examples.
