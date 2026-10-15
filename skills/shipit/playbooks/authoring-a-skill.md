### Authoring or modifying a skill

**You own the skill's voice.**

1. Decide whether it should be a skill at all, and where it lives. A personal skill is `~/.claude/skills/<name>/SKILL.md`, a project skill is `.claude/skills/<name>/SKILL.md` in the repo. Every skill Claude may invoke on its own puts its `name` and `description` into the context of every session, before anyone asks for it. So a rule that applies inside one workflow belongs in that workflow's skill or in a reference file it reads, not in a new skill. This is why shipit's principles are files under `~/.claude/skills/shipit/principles/`, not skills. If the **skill-creator** skill is installed, use it for the scaffold and its trigger evals.
2. Write the frontmatter:
   - `name`. Lowercase and hyphens, the same as the folder name. The user types it as `/name`.
   - `description`. What it does and when to use it, in one or two sentences, with the words a user would actually type. It is the only thing Claude sees when deciding whether to load the skill, and it costs context in every session, so cut any clause that does not help pick it. All "when to use" text goes here, not in the body.
   - `disable-model-invocation: true` for a skill only the user should start: a mode, a workflow with side effects, anything that should not fire because a description happened to match. Claude then can't load it through the Skill tool, so another skill that needs it says to Read its `SKILL.md` by path.
   - `allowed-tools` only when the skill needs tools to run without a permission prompt while it is active (for example `Bash(git status:*)`). Grant the narrowest pattern that works.
   - Nothing else unless the skill needs it.
3. Shape the body for progressive disclosure. The description is always loaded. `SKILL.md` loads when the skill is used, so keep it to the steps and rules every run needs (well under 500 lines). Detail that only some runs need goes in `references/<topic>.md`, with a line in `SKILL.md` saying when to read it. Code the skill runs goes in `scripts/`, run rather than read. Reference the skill's own files relative to its folder (`references/x.md`), and other skills by their installed path (`~/.claude/skills/<name>/SKILL.md`).
4. Validate the skill: frontmatter has `name` and `description`, `name` matches the folder, referenced files exist, cross-skill links resolve to installed paths. Then check that it triggers. Start a fresh session, send a few prompts that should load it and a few near-misses that share its words but should not, and see which ones load it. Rewrite the description until both sets behave.
5. Test cases if structural. Skip if subjective. A change meant to alter how agents behave goes through the Eval playbook (`~/.claude/skills/shipit/playbooks/eval.md`) before it is promoted.
6. Run **Opening a PR** (`~/.claude/skills/shipit/playbooks/opening-a-pr.md`).

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources (types, READMEs, config) per the **Encode Lessons in Structure** principle (`~/.claude/skills/shipit/principles/encode-lessons-in-structure.md`). Delegate to other skills by path. Don't restate. A workflow you keep hitting but isn't captured → propose a new skill, and weigh its description's cost in every session against how often it would fire.

**Reply:** summary of the skill, key design decisions (what went in the description, the body, and the reference files, and why), validation notes including which prompts loaded it and which did not.
