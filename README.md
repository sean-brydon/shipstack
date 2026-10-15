# shipstack

Rigorous agent workflows for Claude Code, built for [Shipyard](https://github.com/cosscom/shipyard) (berth). Type `/shipit` with a task. It picks a playbook, copies its steps into the todo list, runs the other skills as the steps need them, and doesn't call anything done until it has shown you the proof.

shipstack is an adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (MIT), ported from Cursor to Claude Code. The substance is pstack's: the playbooks, the 24 principles, the multi-model review panels, the writing rules. What changed is listed under [What's different from pstack](#whats-different-from-pstack).

## Install

```sh
git clone https://github.com/sean-brydon/shipstack ~/shipstack
cd ~/shipstack
./install.sh            # links skills into ~/.claude/skills and agents into ~/.claude/agents
./install.sh --dry-run  # show what it would link
./install.sh --uninstall
```

Links, not copies, so an edit or a `git pull` applies to the next session. The script never overwrites a file or folder it didn't link.

Needs Claude Code. Optional: `gh` for the PR playbooks, `bun` for the helper scripts, `codex` as a second-vendor reviewer, and berth (Shipyard) for worktree tasks, browser proof and artifacts. Everything that uses berth falls back to plain Claude Code without it.

Then, in a new Claude Code session:

```text
/setup-shipit                  # optional: models per role, effort budget, codex as a second vendor
/shipit <task>                 # route a task to a playbook
/shipit-help <question>        # which skill or playbook fits
```

shipit expects Claude Code's auto permission mode for long runs. `skills/shipit/references/auto-mode.md` has what auto mode blocks, how shipit behaves when a call is denied, and the one setting worth adding (`autoMode.environment` naming the repos you push to).

## What's in it

- **`/shipit`**, the router. 29 playbooks, grouped as thinking (ideation, investigation, research), building (feature, bug fix, refactoring, prototype, design audit, visual parity, parallel build, launch video), measuring (perf, hillclimb, runtime and trace forensics, eval), delivering (opening a PR, babysit, shipping, release, multi-phase plan), running long (autonomous run, orchestrate, autopilot, session pickup, pause safely), and housekeeping (authoring a skill, worktree cleanup).
- **28 skills you can type directly.** `/how`, `/why`, `/teach`, `/recall`, `/ketchup` to understand. `/architect`, `/arena`, `/swarm`, `/interrogate`, `/blast-radius` to design and review. `/tdd`, `/benchmark-checklist`, `/no-comments`, `/unslop`, `/technical-writing` to build and clean. `/reflect`, `/correct`, `/automate-me`, `/show-me-your-work`, `/figure-it-out`, `/create-verification-skill` to improve the stack itself. `/shipit-help` lists them all.
- **24 principles** in `skills/shipit/principles/`. They are files the router indexes, not skills, so they cost no context until one applies.
- **2 agents.** `shipit-agent`, the delegate every playbook spawns, and `comment-sicko`, the read-only comment reviewer.

Almost every skill sets `disable-model-invocation`, so its description stays out of your sessions' context. The router reaches them by reading their files. Only `setup-shipit` is listed in every session.

## What's different from pstack

- **Claude models.** Roles map to `opus`, `sonnet`, `fable` or `haiku` plus an `effort` level, instead of slugs with effort baked in. Review panels mix families (opus, sonnet, fable), and `codex` is an opt-in second vendor. `/setup-shipit` writes `~/.claude/shipit/models.md`.
- **berth where it's better.** Parallel attempts get a berth task each (own worktree, port, env, and a report back when done). Proof uses `berth-browser`, `berth-visual-diff` and `berth-preview`. Results go to `berth-artifacts`. Lessons become `berth-hooks` gates. Every berth step has a plain Claude Code fallback.
- **Proof and artifacts are non-negotiable.** Nothing is done, and no PR opens, without a proof pack (`skills/shipit/references/proof-pack.md`): light and dark screenshots, before/after diffs, charts with their source command, a checks table. Numbers, comparisons and plans go out as artifacts, not prose.
- **Shaped by how its author works.** A pass over the author's own Claude Code transcripts (kept private) added the Ideation, Research, Design audit, Parallel build, Release and Launch video playbooks, the 8/10 design bar, the fan-out cap of five, and the default that every PR targets main, with no stacks unless asked.
- **Auto mode aware.** A denied call is logged and reported, never retried or routed around. Playbooks prefer the reversible git forms auto mode doesn't refuse.
- **Dropped.** Cursor-only pieces: custom modes, Grok Bot UI, the benny automation pack, Origin, Cursor cloud agents.

## Repo layout

```
skills/<name>/SKILL.md          each skill, linked to ~/.claude/skills/<name>
skills/shipit/playbooks/        the playbooks
skills/shipit/principles/       the principles
skills/shipit/references/       proof pack, review-bot triage, auto mode
skills/shipit/scripts/          watch-pr, orch, check-plan, worktree-audit (bun; `bun test` there)
agents/                         linked to ~/.claude/agents
docs/guide/                     a walkthrough, start at docs/guide/README.md
docs/porting.md                 the pstack → shipit mapping, for re-syncing with upstream
```

## License

MIT. See `LICENSE`. pstack is copyright Lauren Tan.
