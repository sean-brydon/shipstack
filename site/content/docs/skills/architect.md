---
title: "/architect"
description: "Sketch types, signatures, and module structure before code, then stay in the loop while implementation fills in. Use for /architect, 'architect this', 'design this', or non-trivial work where jumping to code would lock in the wrong shape."
---

Sketch types, function signatures, class shapes, and module boundaries with `not implemented` bodies and pseudocode. Synthesize across multiple model perspectives, then fill in code against the chosen sketch.

## Start

Open a todolist with one entry per phase before starting.

1. Ground
2. Sketch
3. Agree
4. Implement
5. Scrap

## Phase A: Ground the problem

Build a real mental model of every system the new code touches. Run the **how** skill ([`~/.claude/skills/how/SKILL.md`](/skills/how)) over the relevant subsystems. Naming a file isn't grounding. Produce the architectural explanation `how` prescribes. If the design redefines ownership or layering, also run the **why** skill ([`~/.claude/skills/why/SKILL.md`](/skills/why)) on the existing shape so the rationale becomes a constraint, not a guess.

Skip Phase A only when the work is genuinely greenfield with no surrounding system to integrate.

## Phase B: Sketch

Run the **arena** skill ([`~/.claude/skills/arena/SKILL.md`](/skills/arena)) with the design-sketch task and the Phase A grounding artifacts. Pass `references/runner-prompt.md` as each runner's prompt.

Take the runners from the `architect runners` line in `~/.claude/shipit/models.md`, in place of the `arena runners` line. If the file or that line is missing, use `opus` and `sonnet`. `inherit`, `codex`, and rejected entries follow the runner rules in the **arena** skill's Phase A, and so do isolation (a berth task or an Agent tool worktree per runner) and `effort`.

Design it twice. Require at least two structurally distinct candidates before synthesis, even when the first looks sufficient. This is the **Exhaust the Design Space** principle ([`~/.claude/skills/shipit/principles/exhaust-the-design-space.md`](/principles/exhaust-the-design-space)) made concrete. Whole-shape alternatives, not point fixes inside one shape.

Screen every candidate against [`references/design-red-flags.md`](https://github.com/sean-brydon/shipstack/blob/main/skills/architect/references/design-red-flags.md) before synthesis. Assume the next contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prefer the design where a change that looks right from one file is right for the whole repo.

Compare viable candidates on interface depth. Prefer the design that hides more complexity behind a smaller, simpler public surface. A rich interface can keep call chains short by concentrating capability instead of scattering it across layers.

Arena returns one synthesized design package and its comparison artifact (candidates × rubric). Add the red-flag screen to that comparison as one column per red flag that any candidate tripped. Its synthesis decision fills the rationale's "Synthesis decision" section.

## Phase C: Agree (opt-in)

Default: proceed directly to implementation with the synthesized design. No human checkpoint.

Opt in to a checkpoint when the invoker explicitly asks: "/architect with checkpoint," "stop and show me before implementing," or similar. Then surface the synthesized design and pause for sign-off.

Surface it as a plan the user can look at, not only as prose in the reply. Show the rationale (per `references/rationale-template.md`) as notes and the module map as a Mermaid diagram (modules as nodes, dependencies and data flow as edges). Inside berth, write `design.md` and `modules.mmd` outside the repo's tracked files and register each with `berthd artifact add <file> --title "Design: <task>"` (see the **berth-artifacts** skill). Outside berth, publish them as one page with the `Artifact` tool (load the **artifact-design** skill first), or put the Mermaid block and the rationale in the reply for a small change. End with the question you need answered.

The synthesis can ship as its own commit either way, as the "scaffold first" mode of the **Foundational Thinking** principle ([`~/.claude/skills/shipit/principles/foundational-thinking.md`](/principles/foundational-thinking)). Planned and scoped breakage during fill-in is fine, per the **Outcome-Oriented Execution** principle ([`~/.claude/skills/shipit/principles/outcome-oriented-execution.md`](/principles/outcome-oriented-execution)). For adversarial pressure on the design before implementing, run the **interrogate** skill ([`~/.claude/skills/interrogate/SKILL.md`](/skills/interrogate)) on the synthesized sketch.

If the human pushes back on the shape (in a checkpoint or after the fact), treat that as Phase A evidence. Re-ground and re-run Phase B before writing more code.

## Phase D: Implement against the sketch

Replace `not implemented` bodies with code, pseudocode with logic. The synthesized sketch is the contract. Deviations from it are signal to surface, not friction to absorb silently. If a function needs a parameter the sketch didn't anticipate, ask whether the sketch was wrong, the requirement was missed, or the implementation is overreaching.

## Phase E: Scrap when the architecture is wrong

If implementation keeps producing friction the sketch can't absorb, throw the sketch out. Don't bolt fixes onto a wrong design, per the **Redesign from First Principles** and **Fix Root Causes** principles ([`~/.claude/skills/shipit/principles/redesign-from-first-principles.md`](/principles/redesign-from-first-principles), [`~/.claude/skills/shipit/principles/fix-root-causes.md`](/principles/fix-root-causes)).

The signal is a *pattern*, not single instances. Tells:

- The same shape of workaround appearing repeatedly across unrelated code.
- Multiple unrelated edge cases that all need special-case branches.
- Types that need escape hatches (`any`, casts, optional fields always set in practice) to compile.
- The "we need a lock" reflex when the sketch said the state wasn't shared.
- Callers having to know the abstraction's internal rules to use it.
- Two or more independent Phase D deviations of the same shape across the implementation.

Use judgment. A few edge cases don't condemn an architecture. Some problems are legitimately complex. Complexity in the data is not complexity in the design.

When you scrap:

1. Re-run the **how** skill over what's been built.
2. Redesign as if the new constraints had been day-one assumptions, per Redesign from First Principles.
3. Subtract before adding, per the **Subtract Before You Add** principle ([`~/.claude/skills/shipit/principles/subtract-before-you-add.md`](/principles/subtract-before-you-add)). The new sketch should be smaller than the old one before it grows.
4. Return to Phase B and re-run arena.

## Outputs

The caller's usage is written first and the type sketch derived from it. One file with new types and signatures for small changes. Module map plus type definitions for larger work. The rationale ships alongside, shaped per `references/rationale-template.md`, including the usage sketch and the synthesis decision. The arena comparison artifact from Phase B, and for larger work the module map as a Mermaid diagram, go with it.
