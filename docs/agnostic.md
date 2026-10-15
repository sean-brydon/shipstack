# Agent-agnostic shipstack: the contract

shipstack's skills, playbooks and principles describe **what to do**, in words any coding agent can follow. **How** to do it in a given agent lives in one adapter file per environment. This file is the contract every rewritten file follows.

## Layout after the rewrite

```
skills/<name>/SKILL.md                     neutral
skills/shipit/SKILL.md                     the router, neutral
skills/shipit/playbooks/*.md               neutral
skills/shipit/principles/*.md              neutral
skills/shipit/references/*.md              neutral (proof-pack, review-bot-triage)
skills/shipit/adapters/claude-code.md      how each neutral term maps to Claude Code
skills/shipit/adapters/codex.md            the same for Codex
skills/shipit/adapters/berth.md            an optional layer: read only when berth is present
skills/shipit/adapters/claude-code/        Claude-only extras: hooks/require-proof.py (+ test), scripts/cost.py,
                                           scripts/automode_repos.py, auto-mode.md (moved from references/)
skills/shipit/scripts/                     agent-neutral scripts only (watch-pr, worktree-audit)
agents/                                    Claude Code subagent files (shipit-agent, comment-sicko), installed for Claude only
```

The router's first step becomes: work out which agent you are and read `adapters/<agent>.md` (Claude Code → `claude-code.md`, Codex → `codex.md`, anything else → follow the neutral text and use plain equivalents). If berth is present (any `BERTH_*` env var, `berthd` on PATH), also read `adapters/berth.md`.

## Neutral vocabulary

Use these words in every skill, playbook and principle. Never name a tool, model ID, setting key or CLI that belongs to one agent or to berth. The adapters say what each word means.

| say this | not this |
|---|---|
| **spawn a helper** (read-only: "a read-only helper"; writing code: "a writing helper in its own worktree") | the Agent tool, `subagent_type`, `Explore`, `general-purpose`, `isolation: "worktree"`, `shipit-agent`, `berthd task new`, `codex exec` |
| **the delegate brief** (what you hand a helper) | prompt to the Agent tool |
| **ask the user** (numbered questions with a recommended answer each; see the grill skill's format) | `AskUserQuestion` |
| **the todo list** | `TodoWrite`, `TaskCreate`, `update_plan` |
| **the role's model**: `reading`, `code`, `judgment`, `hardest`, `verification`, and panel roles (`arena runners`, `interrogate reviewers`, `architect runners`, `arena cross-judge pool`, `swarm workers`); "a different model family" for diversity | `opus`, `sonnet`, `haiku`, `fable`, `effort: "xhigh"`, `model:` params |
| **effort** (low/medium/high/max, raise or lower one step) | `xhigh`, the `effort` param name |
| **an artifact** (something the user can open: a page, a chart, a table, a screenshot) | the `Artifact` tool, `berth-artifacts`, `berthd artifact add` |
| **drive the real surface** / **take screenshots** (light and dark) / **a visual diff against main** | `berth-browser`, `berth-visual-diff`, `claude-in-chrome`, Playwright by name |
| **the permission mode**, "if a call is refused" | auto mode, the classifier, `settings.json` |
| **saved memories** / **the project's saved rejections** | `~/.claude/projects/*/memory`, `MEMORY.md` |
| **the session transcripts** | `~/.claude/projects/<slug>/*.jsonl`, `~/.codex/sessions` |
| **end your turn; the helper reports back** | background-task notifications, `<berth-notification>` |
| **the <x> skill** (`<skills>/x/SKILL.md`, where `<skills>` is the folder that holds every shipstack skill) | `~/.claude/skills/x/SKILL.md` |
| **a playbook** (`playbooks/<x>.md` in the shipit skill) | `~/.claude/skills/shipit/playbooks/<x>.md` |
| **a principle** (`principles/<x>.md` in the shipit skill) | `~/.claude/skills/shipit/principles/<x>.md` |
| built-in cleanup / review: "run your agent's simplify and review passes if it has them, else do them by hand" | `/simplify`, `/code-review` |

Keep `gh`, `git`, test runners and other ordinary developer CLIs: they are not agent-specific.

When a step genuinely only exists in one environment (the proof hook, the cost receipt, the auto-mode repos setup), the neutral file says the outcome ("end long runs with a cost receipt: see your adapter") and the adapter says how, or says it's unavailable.

## What each adapter must cover

Each adapter is a table from every neutral term above to the concrete thing, plus a short section per Claude-only or Codex-only feature. Do not invent capabilities: check the agent's own help (`codex --help`, `codex exec --help`) and only claim what exists.

- **claude-code.md**: Agent tool (`Explore` for read-only, `shipit-agent` for writing, `isolation: "worktree"`, background by default, notifications), `AskUserQuestion` (1-4 questions, 2-4 options; else plain text), todo tools, model roles → `models.md` values (`haiku`/`sonnet`/`opus`/`fable`/`inherit`/`codex`) and the `effort` param with the default role table (from the current router and `docs/porting.md`, including the 2026-10 eval: reading roles on Haiku at the budget's starting effort), the Artifact tool (+ artifact-design/dataviz skills), claude-in-chrome, `/simplify`, `/code-review`, `/loop`, auto mode (move `references/auto-mode.md` into `adapters/claude-code/auto-mode.md`), saved memory location, transcript location (from `skills/recall/references/transcripts.md`), the proof hook, `cost.py`, `automode_repos.py`.
- **codex.md**: helpers are `codex exec` runs (`-s read-only` for reading, `-s workspace-write` in a git worktree for writing, `-C <dir>`, `-o <answer file>`, `-m <model>`, run in the background and read the answer file when done); asking the user is plain numbered text; the todo list is Codex's plan tool if present, else a checklist in the reply; model roles map to `-m` values the user sets in `models.md` (default: the session's model for every role, say so honestly); no subagent files, no hooks unless Codex supports them (check), no cost receipt unless its session logs carry usage (check `~/.codex/sessions`); skills live in `~/.agents/skills`; transcripts in `~/.codex/sessions/YYYY/MM/DD/*.jsonl` (verify the shape before describing it).
- **berth.md**: what changes when berth is present, step by step: helpers become berth tasks (`berthd task new <loc>/<name> --agent <id> --prompt`, or the `berth_task_new` / `berth_attempts` MCP tools), report back by notification; proof uses berth-browser / berth-visual-diff / berth-preview; artifacts via berth-artifacts; checks via `berthd exec`; lessons as `before:` hooks via berth-hooks; worktree cleanup via `berthd worktree rm`. All berth commands live here and nowhere else. Read the real flags from the installed berth skills (`~/.claude/skills/berth*/SKILL.md`).

## models.md

`setup-shipit` keeps writing `models.md`, now at `<config>/shipit/models.md` where the adapter names `<config>` (`~/.claude` for Claude Code, `~/.agents` for Codex). Role names stay the same. Values are whatever the adapter allows.

## Install

`install.sh` links every skill into each agent it finds: `~/.claude/skills` when Claude Code is present (`claude` on PATH or `~/.claude` exists), `~/.agents/skills` when Codex is (`codex` on PATH or `~/.codex` exists). Subagent files in `agents/` go to `~/.claude/agents` only. `--agent claude|codex|all` overrides detection. Everything else stays as it is (links, never overwrite, `--dry-run`, `--uninstall`).

## Writing

Same rules as before: short declarative sentences, no long-dash character, no colon as a mid-sentence connector, keep every step's substance. Don't shorten a playbook while neutralizing it unless a sentence only existed to name a tool. Credits stay (pstack, Matt Pocock for grill).
