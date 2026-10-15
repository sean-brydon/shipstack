---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture and runtime flow. Use why for motivation."
disable-model-invocation: true
---

# How

Read the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn is a helper. Explorers are read-only helpers. The explainer is also a helper, and its prompt says it must not edit files, because it has to read whole files to reconcile the explorers, not excerpts.

**Models.** Explorers use the `how explorer` role in `models.md`, and every explainer uses the `how explainer` role. If a role is missing, use the adapter's default for it. Set each helper's effort from the budget in `models.md`, then adjust it for the job per the Helpers section of the **shipit** skill (`<skills>/shipit/SKILL.md`). Explorers keep the starting effort, never lowered. If a value can't be used here, use the default and say so. The adapter says which concrete models fill the roles and how to run a seat on another vendor. If that isn't possible, run the seat on the role's default and say so.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn all explorers at once, each with `references/explorer-prompt.md` and its angle filled in. They run in the background. End your turn; each helper reports back when done. Don't poll.

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the explainer's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

When the explanation includes a diagram of a flow with several components or stages, show it as a diagram the user can look at, not only as a code block:

- Keep the Mermaid block in the reply. Where your adapter can show a diagram as an artifact, write the Mermaid to a `.mmd` file outside the repo's tracked files and make it an artifact too.
- If the explanation is long enough that the user will come back to it, make it a page artifact (see your adapter).

Skip the diagram when prose covers the flow. A diagram should clarify, not decorate.

## Output format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
