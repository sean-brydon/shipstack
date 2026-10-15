---
name: grill
description: Interview the user in rounds until the plan is sharp, with a recommended answer to every question, and record settled terms and decisions in the project's GLOSSARY.md and docs/adr/. Use for /grill, "grill me", or before building anything whose what, scope or behavior is still open.
---

# Grill

Adapted from Matt Pocock's `grilling` and `domain-modeling` skills (MIT, github.com/mattpocock/skills).

**What it does.** Interviews the user until you both agree on what to build, then hands a short agreed brief to whatever runs next.
**Why.** The usual failure is building the wrong thing well. Questions are cheaper than rework.

## The design tree

Treat the plan as a tree: every decision branches into the decisions that depend on it. The **frontier** is every decision whose prerequisites are already settled, the questions you can ask now without guessing at answers you haven't heard.

Work in **rounds**. Each round asks the whole frontier, numbered, with your recommended answer under each, then waits. Word each question so "yes" accepts your recommendation.

```
**Q1. <title>.** <the question, with the options if there are any>
→ <your recommended answer, and why in one line>

**Q2. <title>.** …
→ …
```

The answers reshape the tree: settled decisions push the frontier outward. Recompute it and ask the next round. A question that depends on another question still open this round waits for a later round.

- **Facts are yours, decisions are theirs.** Never ask the user something you could look up. When a frontier question needs a fact from the code, the history or a running system, send a read-only helper to find it (see your agent's adapter) and ask the rest of the frontier meanwhile. Only the questions downstream of that fact wait.
- **Recommend every time.** A question without a recommendation hands the user your work.
- **Keep rounds small.** Three to six questions. If the frontier is bigger, ask the ones that unblock the most first.
- **Use the project's words.** Read `GLOSSARY.md` first if it exists (or the context `GLOSSARY.md` that `GLOSSARY-MAP.md` points to). Call out a term the user uses differently from the glossary: "The glossary says a cancellation is X; you seem to mean Y. Which?"
- **Sharpen fuzzy language.** When a term is vague or overloaded, propose one precise word.
- **Test with scenarios.** Invent concrete edge cases that force the boundaries ("an order is half shipped and the customer cancels: what happens?").
- **Check the code.** When the user says how something works, check that the code agrees, and say so when it doesn't.
- **Respect saved rejections.** A saved memory that says "don't X" settles that branch. Don't re-ask it.

## Writing things down as they settle

- **Glossary.** When a term is resolved, update `GLOSSARY.md` right away, in the format in `references/glossary-format.md`. Create it lazily, on the first resolved term. It holds project terms only, no implementation details.
- **Decision records.** Offer an ADR only when the decision is hard to reverse, surprising without context, and the result of a real trade-off. All three, or skip it. Format in `references/adr-format.md`, in `docs/adr/`, created lazily.

## Done

The session is done when the frontier is empty: every branch visited, nothing silently assumed. Then write the **agreed brief**: one paragraph of what and why, the decisions as a short list, and what is explicitly out of scope. Ask the user to confirm it. Don't build anything until they do. After confirmation, hand the brief to the playbook that runs next (or `/shipit` if the user called `/grill` on its own).

Skip grilling when the ask is already fully specified, when it's a trivial change, or when the user says "just do it".
