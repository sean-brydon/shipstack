---
title: "Playbooks"
description: "The 22 playbooks /shipit routes tasks to."
---

A playbook is the checklist `/shipit` follows for one kind of task. You never name it: you describe the task, and the router picks the playbook and copies its steps into the todo list. These pages are generated from `skills/shipit/playbooks/`.

## Thinking

- **[Ideation](/playbooks/ideation).** An idea, a "what if", a plan request, "no code". Options with a recommendation in an artifact, then stop for the pick.
- **[Investigation](/playbooks/investigation).** Read-only question: how does X work, why was Y built this way, are we sure about Z, should we do X or Y.
- **[Research](/playbooks/research).** Outward-looking: how do other products or projects do X, audit competitors, score ours against theirs.

## Building

- **[Feature](/playbooks/feature).** New or changed behavior, built from a named data shape.
- **[Bug fix](/playbooks/bug-fix).** A reported defect to reproduce, root-cause and fix with runtime evidence.
- **[Refactoring](/playbooks/refactoring).** A behavior-preserving change to structure or shape.
- **[Prototype](/playbooks/prototype).** A throwaway sketch to make a design or behavioral decision cheaply, or to settle an empirical fork by observing it.
- **[Design audit](/playbooks/design-audit).** UI that has to look right: audit against the design system, screenshot light and dark, score to 8/10, iterate in rounds.
- **[Visual parity](/playbooks/visual-parity).** Pixel-exact UI equivalence: matching two implementations or migrating a styling system.

## Measuring

- **[Perf issue](/playbooks/perf-issue).** A measured slowness to trace and improve against a baseline.
- **[Hillclimb](/playbooks/hillclimb).** Sustained improvement of one metric against a target, with before/after per hypothesis and one commit per accepted win.
- **[Runtime forensics](/playbooks/runtime-forensics).** Diagnose a live symptom (leak, idle-CPU spin, glitch) from instrumentation. The deliverable is a diagnosis.
- **[Trace forensics](/playbooks/trace-forensics).** Diagnose a captured profiling artifact. The deliverable is a diagnosis.
- **[Eval](/playbooks/eval).** Test how a skill, structure or prompt change affects agent behavior before promoting it.

## Delivering

- **[Opening a PR](/playbooks/opening-a-pr).** Invoked at the end of every building playbook. Requires the proof pack.
- **[Babysit](/playbooks/babysit).** Drive a PR to merge-ready: conflicts, review threads, CI.
- **[Shipping](/playbooks/shipping).** Independently verify green PRs, then land the verified ones.

## Running long

- **[Autonomous run](/playbooks/autonomous-run).** A long task driven to completion without stopping.
- **[Session pickup](/playbooks/session-pickup).** Resume or take over another agent's in-flight work.
- **[Pause safely](/playbooks/pause-safely).** Suspend in-flight work cleanly so it can be resumed.

## Housekeeping

- **[Authoring or modifying a skill](/playbooks/authoring-a-skill).** Writing or editing a SKILL.md.
- **[Worktree and simulator cleanup](/playbooks/worktree-cleanup).** Reclaim disk by pruning merged or abandoned worktrees, safety-gated.
