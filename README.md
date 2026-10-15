# shipstack

Rigorous agent workflows for Claude Code and Codex, built for [Shipyard](https://github.com/cosscom/shipyard) (berth). Type `/shipit` with a task. It picks a playbook, copies its steps into the todo list, runs the other skills as the steps need them, and doesn't call anything done until it has shown you the proof.

shipstack is an adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (MIT), ported from Cursor to Claude Code and Codex. The substance is pstack's: the playbooks, the 24 principles, the multi-model review panels, the writing rules. What changed is listed under [What's different from pstack](#whats-different-from-pstack).

## Install

```sh
git clone https://github.com/sean-brydon/shipstack ~/shipstack
cd ~/shipstack
./install.sh                  # links skills into every agent it finds
./install.sh --agent codex    # or pick: claude, codex, all
./install.sh --dry-run        # show what it would link
./install.sh --uninstall      # remove its links from both places
```

Claude Code gets the skills in `~/.claude/skills` and the two subagents in `~/.claude/agents`. Codex gets the skills in `~/.agents/skills`. Links, not copies, so an edit or a `git pull` applies to the next session. The script never overwrites a file or folder it didn't link.

**Works with** Claude Code fully, and Codex with the plain fallbacks `skills/shipit/adapters/codex.md` lists (no artifacts, no background notifications, no proof hook, a token-only cost receipt). berth (Shipyard) is optional: with it, helpers become berth tasks and proof uses its browser, visual diff and artifacts. Each agent's specifics live in one adapter under `skills/shipit/adapters/`. `docs/agnostic.md` is the contract.

Optional: `gh` for the PR playbooks, `bun` for the helper scripts, and the other agent's CLI as a second-vendor seat on review panels.

Then, in a new session:

```text
/setup-shipit                  # optional: models per role, effort budget, a second vendor
/shipit <task>                 # route a task to a playbook
/shipit-help <question>        # which skill or playbook fits
```

In Codex, name the skill instead ("use the shipit skill to …").

### Claude Code extras

`skills/shipit/adapters/claude-code/` holds what only Claude Code can use. `auto-mode.md` covers auto mode, which shipit expects for long runs: what it blocks, how shipit behaves when a call is denied, and the one setting worth adding (`autoMode.environment` naming the repos you push to, which `/setup-shipit` can write).

**Enforce the proof rule.** `hooks/require-proof.py` is a `PreToolUse` hook. It refuses `gh pr create` when the PR body has no `## Proof` section with something under it. One line is enough for a nit. Turn it on by adding this to `~/.claude/settings.json` under `hooks`:

```json
"PreToolUse": [
  { "matcher": "Bash", "hooks": [ { "type": "command", "command": "python3 -I ~/.claude/skills/shipit/adapters/claude-code/hooks/require-proof.py" } ] }
]
```

Its cases run with `python3 -I skills/shipit/adapters/claude-code/hooks/require-proof.test.py`.

**Cost receipt.** `python3 -I ~/.claude/skills/shipit/adapters/claude-code/scripts/cost.py` prints what the current session and each of its subagents cost at list API prices, by agent and by model. `/shipit` ends long runs with it. `--csv out.csv` writes the rows. Output tokens are a floor (hidden thinking isn't in transcripts), and on a subscription the dollars are usage, not a bill.

## What's in it

- **`/shipit`**, the router. 22 playbooks, grouped as thinking (ideation, investigation, research), building (feature, bug fix, refactoring, prototype, design audit, visual parity), measuring (perf, hillclimb, runtime and trace forensics, eval), delivering (opening a PR, babysit, shipping), running long (autonomous run, session pickup, pause safely), and housekeeping (authoring a skill, worktree cleanup).
- **29 skills you can type directly.** `/how`, `/why`, `/teach`, `/recall`, `/ketchup` to understand. `/grill` to pin down what to build. `/architect`, `/arena`, `/swarm`, `/interrogate`, `/blast-radius` to design and review. `/tdd`, `/benchmark-checklist`, `/no-comments`, `/unslop`, `/technical-writing` to build and clean. `/reflect`, `/correct`, `/automate-me`, `/show-me-your-work`, `/figure-it-out`, `/create-verification-skill` to improve the stack itself. `/shipit-help` lists them all.
- **24 principles** in `skills/shipit/principles/`. They are files the router indexes, not skills, so they cost no context until one applies.
- **2 agents.** `shipit-agent`, the delegate every playbook spawns, and `comment-sicko`, the read-only comment reviewer.

Almost every skill sets `disable-model-invocation`, so its description stays out of your sessions' context. The router reaches them by reading their files. Only `setup-shipit`, `grill` and `typescript-best-practices` are listed in every session, so the agent can reach for them without being told.

## What's different from pstack

- **Roles, not slugs.** Each role maps to a model plus an effort level, instead of slugs with effort baked in. On Claude Code, roles map to `opus`, `sonnet`, `fable` or `haiku` and review panels mix families, with `codex` as an opt-in second vendor. `/setup-shipit` writes `models.md` in the config folder the agent's adapter names.
- **berth where it's better.** Parallel attempts get a berth task each (own worktree, port, env, and a report back when done). Proof uses `berth-browser`, `berth-visual-diff` and `berth-preview`. Results go to `berth-artifacts`. Lessons become `berth-hooks` gates. Every berth step has a plain fallback.
- **Proof and artifacts are non-negotiable.** Nothing is done, and no PR opens, without a proof pack (`skills/shipit/references/proof-pack.md`): light and dark screenshots, before/after diffs, charts with their source command, a checks table. Numbers, comparisons and plans go out as artifacts, not prose.
- **Shaped by how its author works.** A pass over the author's own Claude Code transcripts (kept private) added the Ideation, Research and Design audit playbooks, the 8/10 design bar, the fan-out cap of five, and the default that every PR targets main, with no stacks unless asked.
- **Auto mode aware.** A denied call is logged and reported, never retried or routed around. Playbooks prefer the reversible git forms auto mode doesn't refuse.
- **Dropped.** Cursor-only pieces: custom modes, Grok Bot UI, the benny automation pack, Origin, Cursor cloud agents.

## Repo layout

```
skills/<name>/SKILL.md          each skill, linked to ~/.claude/skills/<name> and ~/.agents/skills/<name>
skills/shipit/playbooks/        the playbooks
skills/shipit/principles/       the principles
skills/shipit/references/       proof pack, review-bot triage
skills/shipit/adapters/         one file per agent (claude-code, codex) plus berth; claude-code/ holds the hook, cost.py, auto mode
skills/shipit/scripts/          watch-pr, worktree-audit (bun; `bun test` there)
agents/                         Claude Code subagents, linked to ~/.claude/agents
docs/guide/                     a walkthrough, start at docs/guide/README.md
docs/agnostic.md                the agent-agnostic contract
docs/porting.md                 the pstack → shipit mapping, for re-syncing with upstream
```

## License

MIT. See `LICENSE`. pstack is copyright Lauren Tan.
