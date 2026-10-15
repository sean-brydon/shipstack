---
name: automate-me
description: "Use for \"automate me\", \"create/update/refresh my -mode skill\", \"turn/capture my preferences or working style into a skill\", or wanting agents to follow how the user works. Drafts or revises a personal -mode skill that routes through shipit, mined from the user's Claude Code transcripts and memory."
disable-model-invocation: true
---

# Automate me

A guided flow for turning the user's working conventions into a skill agents will follow. The output is one `-mode` skill tailored to them (e.g. `jay-mode`, `priya-mode`) at `~/.claude/skills/<handle>-mode/SKILL.md`. It routes through shipit: the **shipit** skill stays the base (its playbooks, principles and subagent rules), and the mode skill holds only where the user differs or adds.

This skill orchestrates three others: an inline mining pass (see step 1), the Authoring a skill playbook (`~/.claude/skills/shipit/playbooks/authoring-a-skill.md`, authoring), and the **unslop** skill (prose discipline). It sequences them. It doesn't replace them.

## Flow

### 0. Check for an existing skill

Look for `~/.claude/skills/*-mode/SKILL.md` and, recursively, `.claude/skills/**/*-mode/SKILL.md` in the project, matching the user's handle. Mode skills can live in a personal category directory (`.claude/skills/<handle>/`), not only at the top level. Skip `shipit` itself. If one exists, confirm intent with `AskUserQuestion` (unless they already said "update my skill" or similar):

- Update the existing skill (default for repeat runs)
- Start fresh (rare, ask why before doing it)

Update mode changes the rest of the flow:
- Step 1 mines only history since the skill was last edited (`git log -1 --format=%cI <path>` when the file is in a repo, else its modification time).
- Step 2 asks what's changed or missing, not what to capture from zero.
- Step 4 edits the existing file in place. Preserve sections the user hasn't contradicted. Revise ones with new evidence. Add new sections only for genuinely new rules.

### 1. Mine their history

Locate the active project's transcripts before fanning out: `~/.claude/projects/<slug>/*.jsonl`, plus the slugs of this repo's other worktrees if the user works across them. The slug rule, the record shapes, and the `jq` filter that keeps only the human's own turns (skipping tool results, system reminders, task notifications, subagent hand-backs and `<berth-notification>` messages) are in `~/.claude/skills/recall/references/transcripts.md`. Use only those paths. Don't glob across `~/.claude/projects/*/`. That crosses workspace boundaries and reads private chats from unrelated projects. If the user wants their style mined from other projects, they name them.

Read the distilled record first, in the main thread, since it is small:

- **Project memory.** `~/.claude/projects/<slug>/memory/MEMORY.md` and its files. `feedback` and `user` memories are the user's corrections and preferences, already written down once. They are high-confidence signals.
- **Agent instruction files.** `~/.claude/CLAUDE.md` and the repo's `CLAUDE.md` / `AGENTS.md`. These rules already load in every session. The mode skill doesn't restate them. It covers what they don't.

Then survey recent conversations within that scope for recurring patterns. Run multiple parallel subagents across slices of history (e.g. last 2-4 weeks, split into 3 slices so each has enough material), `Agent` calls with `subagent_type: "Explore"`, `model` from the `automate-me miners` line of `~/.claude/shipit/models.md` (default `sonnet`, no `model` for `inherit`), `effort` per the Subagents section of the **shipit** skill (`~/.claude/skills/shipit/SKILL.md`). Each slice mining subagent reads transcripts from the paths the parent provides, reads the human's turns with the filter from `transcripts.md` and the agent's turns around them, looks for the signals below, and returns a short structured list of patterns it saw with evidence pointers (session id and a short quote). Default signals worth hunting:

- Response preferences (length, tone, format, "dumb it down" corrections)
- Delegation habits (subagents, models, berth tasks, specialized workflows, parallelism)
- Verification posture (what "done" means, unit tests vs live repro, screenshots, reviewers)
- Code and prose discipline (style, principles cited, lint/format tools)
- Process conventions (worktrees, commits, PRs, review/merge tooling)
- Meta preferences (fixing skills mid-task, proposing new ones)
- Which shipit playbooks and skills they reach for, and which steps they keep skipping or overriding

Cross-check across slices before elevating a signal. Patterns seen in 2+ slices, or in a slice and a memory file, are high-confidence. Lone signals are weak and usually get dropped.

### 2. Ask the user directly

Mining misses intent that hasn't come up yet. Use the `AskUserQuestion` tool (structured multiple choice) rather than asking the user to type from scratch.

Shape: one or two questions with up to four options each (the tool adds a free-text choice), `multiSelect: true` for category questions. Start broad ("Which areas matter most?"), then follow up on selected areas with specific options. After the structured rounds, one free-form chat question catches anything the options missed.

Don't dump 20 questions.

### 3. Cluster findings

Group the combined signals into sections. Common ones (use only what applies):

- **Response style**: length, tone, format.
- **Autonomy**: how much to do without asking, MCP tool use, permission mode.
- **Understand first**: which skills to reach for when scoping or investigating a change.
- **Subagents**: default, parallelism, model-to-task, berth tasks, specialized workflows.
- **Prose / code discipline**: principles, lint tools, style guides.
- **Review and verify**: repro posture, verification skills, live-testing tools, proof format.
- **Process**: git worktrees, commits, PRs, review/merge tooling.
- **Skills**: skill-authoring habits, fix-the-skill-first, proposing new skills.

Show the clustered findings to the user as a table before drafting (section, rule, evidence count, sources). Inside berth, register it with the **berth-artifacts** skill. Otherwise a markdown table in the reply.

The **shipit** skill shows the shape. Read it for granularity. Don't copy its content. The user's rules are not the same as shipit's.

### 4. Draft the skill

Author the skill per the Authoring a skill playbook (the `anthropic-skills:skill-creator` skill helps if installed). Placement:

- Path: preserve an existing mode skill's location. For a new mode, default to `~/.claude/skills/<handle>-mode/SKILL.md` (personal, every project). Use the project's `.claude/skills/<handle>-mode/` only when the user wants it shared with the repo, or `.claude/skills/<handle>/<handle>-mode/` when the repo has an established personal category for that handle.
- Handle: the user's first name or chosen identifier.
- Frontmatter: `name: <handle>-mode` and a `description` that triggers on their name + `/<handle>-mode` + "work in their style", not on generic keywords like "write code" or "review PR".
- Frontmatter formatting: keep `description` as one YAML scalar. Quote it or use `description: >-` with indented continuation lines when punctuation or wrapping requires it.
- Frontmatter `disable-model-invocation: true` by default. Opt out only if the user explicitly wants their mode to apply on every turn.
- Body: open by routing through shipit. Read `~/.claude/skills/shipit/SKILL.md` and follow it, and where this file says otherwise, this file wins. Then the user's sections, each a set of overrides or additions, with references to shipit's playbooks, principles and skills by installed path rather than restated text.

### 5. Iterate on prose

Apply the **unslop** skill and the authoring playbook's writing rules to every line.

Show the draft to the user and take feedback. Expect multiple iterations. Cut ruthlessly. A mode skill is not a manual.

### 6. Land it

A personal skill in `~/.claude/skills/` takes effect when written. If that path is a symlink into a repo the user keeps (a dotfiles repo, their fork of shipit), commit it there on a branch and open a PR. Don't push to main directly. A project skill under `.claude/skills/` lands the same way: a branch off main, a commit, a PR.

## Guardrails

- **Don't overfit to one conversation.** A preference stated once and contradicted another time is noise. Require multiple instances before codifying it.
- **Don't be clever.** Restating other skills' contents, inventing metaphors, or writing "poetic" prose for an agent reader is cost without benefit. Keep it operational.
- **Reference, don't inline.** Other skills the user relies on should appear as path references, not pasted excerpts. Same for any principle docs they maintain elsewhere, and for rules already in their `CLAUDE.md` or memory.
- **Keep sections minimal.** Only add a section if the user has a specific, non-default rule there. "Communicate clearly" is not a section. "Short paragraphs. Tables when comparing options. Bullets only when items are genuinely parallel." is.
- **Name conventions generic.** Use "the user" or "the human" in imperatives, not the author's first name.
- **Don't force symmetry.** If a user has no process rules worth writing down, skip the Process section entirely.
- **Keep it private.** Quotes from transcripts stay out of the skill. Write the rule, not the conversation it came from.

## Evaluation

A `-mode` skill is subjective output. A test/iterate benchmark loop isn't useful here. Vibe-check with the user: does it read like them? Did it miss anything? Then ship.

Run a description-optimization loop only if the skill's trigger accuracy turns out to be a problem in practice.

## When not to use

- User wants a task-specific skill (not working conventions): the Authoring a skill playbook alone, no mining required.
- User wants to capture one narrow workflow (e.g. "how I write commit messages"). That's a regular skill, not a mode skill.
- User wants one correction to stick in this repo: the **correct** skill, or a Claude Code memory.
