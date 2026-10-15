---
name: automate-me
description: "Use for \"automate me\", \"create/update/refresh my -mode skill\", \"turn/capture my preferences or working style into a skill\", or wanting agents to follow how the user works. Drafts or revises a personal -mode skill that routes through shipit, mined from the user's session transcripts and saved memories."
disable-model-invocation: true
---

# Automate me

A guided flow for turning the user's working conventions into a skill agents will follow. The output is one `-mode` skill tailored to them (e.g. `jay-mode`, `priya-mode`) in the user's skills folder (your adapter names it) as `<handle>-mode/SKILL.md`. It routes through shipit: the **shipit** skill stays the base (its playbooks, principles and helper rules), and the mode skill holds only where the user differs or adds.

This skill orchestrates three others: an inline mining pass (see step 1), the Authoring a skill playbook (`playbooks/authoring-a-skill.md` in the shipit skill), and the **unslop** skill (prose discipline). It sequences them. It doesn't replace them.

## Flow

### 0. Check for an existing skill

Look for `*-mode/SKILL.md` in the user's skills folder and, recursively, in the project's skills folder (your adapter names both), matching the user's handle. Mode skills can live in a personal category directory (`<project skills>/<handle>/`), not only at the top level. Skip `shipit` itself. If one exists, ask the user to confirm intent (unless they already said "update my skill" or similar):

- Update the existing skill (default for repeat runs)
- Start fresh (rare, ask why before doing it)

Update mode changes the rest of the flow:
- Step 1 mines only history since the skill was last edited (`git log -1 --format=%cI <path>` when the file is in a repo, else its modification time).
- Step 2 asks what's changed or missing, not what to capture from zero.
- Step 4 edits the existing file in place. Preserve sections the user hasn't contradicted. Revise ones with new evidence. Add new sections only for genuinely new rules.

### 1. Mine their history

Locate the active project's session transcripts before fanning out, plus those of this repo's other worktrees if the user works across them. Your adapter says where they live and how to read them, including how to keep only the human's own turns (skipping tool results, system reminders, notifications and helper hand-backs). Use only the active project's transcripts. Don't sweep every project's transcripts. That crosses workspace boundaries and reads private chats from unrelated projects. If the user wants their style mined from other projects, they name them.

Read the distilled record first, in the main thread, since it is small:

- **Saved memories.** The project's saved memories. Feedback and user memories are the user's corrections and preferences, already written down once. They are high-confidence signals.
- **Agent instruction files.** The user's global instruction file and the repo's `AGENTS.md` (or your agent's equivalent). These rules already load in every session. The mode skill doesn't restate them. It covers what they don't.

Then survey recent conversations within that scope for recurring patterns. Spawn parallel read-only helpers across slices of history (e.g. last 2-4 weeks, split into 3 slices so each has enough material), using the `automate-me miners` model from the shipit models file and the effort the Helpers section of the **shipit** skill sets. Each slice-mining helper reads the transcripts the parent points it at, reads the human's turns (the way your adapter describes) and the agent's turns around them, looks for the signals below, and returns a short structured list of patterns it saw with evidence pointers (session id and a short quote). Default signals worth hunting:

- Response preferences (length, tone, format, "dumb it down" corrections)
- Delegation habits (helpers, models, specialized workflows, parallelism)
- Verification posture (what "done" means, unit tests vs live repro, screenshots, reviewers)
- Code and prose discipline (style, principles cited, lint/format tools)
- Process conventions (worktrees, commits, PRs, review/merge tooling)
- Meta preferences (fixing skills mid-task, proposing new ones)
- Which shipit playbooks and skills they reach for, and which steps they keep skipping or overriding

Cross-check across slices before elevating a signal. Patterns seen in 2+ slices, or in a slice and a memory file, are high-confidence. Lone signals are weak and usually get dropped.

### 2. Ask the user directly

Mining misses intent that hasn't come up yet. Ask the user (numbered questions, each with options and a recommended answer, per the grill skill's format) rather than asking them to type from scratch.

Shape: one or two questions with up to four options each, plus a free-text choice, and let category questions take several picks. Start broad ("Which areas matter most?"), then follow up on selected areas with specific options. After the structured rounds, one free-form chat question catches anything the options missed.

Don't dump 20 questions.

### 3. Cluster findings

Group the combined signals into sections. Common ones (use only what applies):

- **Response style**: length, tone, format.
- **Autonomy**: how much to do without asking, connected-tool use, permission mode.
- **Understand first**: which skills to reach for when scoping or investigating a change.
- **Helpers**: default, parallelism, model-to-task, specialized workflows.
- **Prose / code discipline**: principles, lint tools, style guides.
- **Review and verify**: repro posture, verification skills, live-testing tools, proof format.
- **Process**: git worktrees, commits, PRs, review/merge tooling.
- **Skills**: skill-authoring habits, fix-the-skill-first, proposing new skills.

Show the clustered findings to the user as a table before drafting (section, rule, evidence count, sources). Show it as an artifact if you can, else a markdown table in the reply.

The **shipit** skill shows the shape. Read it for granularity. Don't copy its content. The user's rules are not the same as shipit's.

### 4. Draft the skill

Author the skill per the Authoring a skill playbook (a skill-creator skill helps if you have one). Placement:

- Path: preserve an existing mode skill's location. For a new mode, default to `<handle>-mode/SKILL.md` in the user's skills folder (personal, every project). Use the project's skills folder only when the user wants it shared with the repo, or `<handle>/<handle>-mode/` there when the repo has an established personal category for that handle.
- Handle: the user's first name or chosen identifier.
- Frontmatter: `name: <handle>-mode` and a `description` that triggers on their name + `/<handle>-mode` + "work in their style", not on generic keywords like "write code" or "review PR".
- Frontmatter formatting: keep `description` as one YAML scalar. Quote it or use `description: >-` with indented continuation lines when punctuation or wrapping requires it.
- Frontmatter `disable-model-invocation: true` by default. Opt out only if the user explicitly wants their mode to apply on every turn.
- Body: open by routing through shipit. Read the shipit skill and follow it, and where this file says otherwise, this file wins. Then the user's sections, each a set of overrides or additions, with references to shipit's playbooks, principles and skills by name and path rather than restated text.

### 5. Iterate on prose

Apply the **unslop** skill and the authoring playbook's writing rules to every line.

Show the draft to the user and take feedback. Expect multiple iterations. Cut ruthlessly. A mode skill is not a manual.

### 6. Land it

A personal skill in the user's skills folder takes effect when written. If that path is a symlink into a repo the user keeps (a dotfiles repo, their fork of shipit), commit it there on a branch and open a PR. Don't push to main directly. A project skill lands the same way: a branch off main, a commit, a PR.

## Guardrails

- **Don't overfit to one conversation.** A preference stated once and contradicted another time is noise. Require multiple instances before codifying it.
- **Don't be clever.** Restating other skills' contents, inventing metaphors, or writing "poetic" prose for an agent reader is cost without benefit. Keep it operational.
- **Reference, don't inline.** Other skills the user relies on should appear as path references, not pasted excerpts. Same for any principle docs they maintain elsewhere, and for rules already in their instruction files or saved memories.
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
- User wants one correction to stick in this repo: the **correct** skill, or a saved memory.
