---
title: "/how"
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture and runtime flow. Use why for motivation."
---

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn is an Agent tool subagent. Explorers use `subagent_type: "Explore"` (read-only). The explainer uses `subagent_type: "general-purpose"` and its prompt says it must not edit files, because it has to read whole files to reconcile the explorers, not excerpts.

**Models.** Read `~/.claude/shipit/models.md` if it exists. Explorers use its `how explorer` line (default `haiku`), and every explainer uses its `how explainer` line (default `opus`). A missing file or line means the default. Set the Agent tool's `model` to that value. Omit `model` for `inherit`. Set `effort` from the file's budget line (`unlimited` max, `large` xhigh, `medium` high, `small` medium, default `large`), then adjust it for the job per the Subagents section (explorers on Haiku keep the starting effort, never lowered) of the **shipit** skill ([`~/.claude/skills/shipit/SKILL.md`](/skills/shipit)). If the Agent tool rejects a value, use the default and say so.

A `codex` value runs that seat through Codex instead of the Agent tool. Write the filled prompt to a file, then run `codex exec -s read-only -C <repo root> -o <answer file> - < <prompt file>` in Bash with `run_in_background: true`. The answer is in the answer file when the background task notifies you. On a berth box, a berth task with `--agent codex` works too (see the **berth-orchestrate** skill). If `codex` is not on PATH, run the seat on the role's default and say so.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn all explorers in a single message, each with `references/explorer-prompt.md` and its angle filled in. They run in the background and notify you when done. End your turn instead of polling.

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the explainer's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

When the explanation includes a diagram of a flow with several components or stages, show it as a diagram the user can look at, not only as a code block:

- Inside berth (`BERTH_*` set, or `berthd` on PATH): write the Mermaid to a `.mmd` file outside the repo's tracked files and register it with `berthd artifact add <file>.mmd --title "<subsystem> flow"`. See the **berth-artifacts** skill. Shipyard draws `graph` and `flowchart` diagrams itself.
- Outside berth: keep the ```mermaid block in the reply. If the explanation is long enough that the user will come back to it, publish it as a page with the `Artifact` tool (load the **artifact-design** skill first).

Skip the diagram when prose covers the flow. A diagram should clarify, not decorate.

## Output format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
