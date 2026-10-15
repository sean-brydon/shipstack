---
title: "Principles"
description: "The 24 principles /shipit applies and cites."
---

Principles are one-rule files the router indexes. They are not skills, so they cost no context until one applies. `/shipit` names the principle that shaped each decision, and you can steer with the names ("apply prove it works"). These pages are generated from `skills/shipit/principles/`.

## Core

- **[Laziness Protocol](/principles/laziness-protocol).** Refactoring, sizing a diff, or tempted to add abstractions, layers or signal threading. Bias to deletion and the smallest change that solves the problem.
- **[Foundational Thinking](/principles/foundational-thinking).** Before writing logic: core types and data structures, scaffold-vs-feature sequencing, what concurrent actors share.
- **[Redesign From First Principles](/principles/redesign-from-first-principles).** Integrating a new requirement into an existing design. Redesign as if it had been foundational from day one.
- **[Attack the Premise](/principles/attack-the-premise).** Two or more fixes that share one premise have failed the same gate. Take a census of which actors hold the imbalance before the next fix, then question the premise.
- **[Subtract Before You Add](/principles/subtract-before-you-add).** Sequencing an addition, refactor or rewrite. Remove dead weight first, then build on the simpler base.
- **[Minimize Reader Load](/principles/minimize-reader-load).** Reviewing or shaping code that's hard to trace. Count layers and hidden state, collapse one-caller wrappers, shrink mutable scope.
- **[Outcome-Oriented Execution](/principles/outcome-oriented-execution).** Planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture, don't preserve throwaway compatibility states.
- **[Experience First](/principles/experience-first).** Product, UX or feature-scope tradeoffs. Choose user delight over implementation convenience. Fewer, polished features. A feature that feels gimmicky gets cut, not polished.
- **[Exhaust the Design Space](/principles/exhaust-the-design-space).** A novel interaction or architectural decision with no precedent. Build 2-3 competing prototypes and compare before committing.
- **[Build the Lever](/principles/build-the-lever).** Any non-trivial work. Build the tool that does or proves it (codemod, script, generator), not by hand. The tool is the artifact a reviewer reruns.

## Architecture

- **[Model the Domain](/principles/model-the-domain).** Stateful logic, or code that branches a lot or repeats a shape assumption across files. Encode the domain in a structure (state machine, typed model, table or registry, reducer, boundary) instead of scattered conditionals.
- **[Boundary Discipline](/principles/boundary-discipline).** Wiring validation, error handling or framework adapters. Guards at system boundaries, trust internal types, keep business logic pure.
- **[Type System Discipline](/principles/type-system-discipline).** Designing types or a signature in any typed language. Make illegal states unrepresentable, brand primitives, parse external data at boundaries.
- **[Make Operations Idempotent](/principles/make-operations-idempotent).** Commands, lifecycle steps or loops that run amid crashes and retries. Converge to the same end state.
- **[Migrate Callers Then Delete Legacy APIs](/principles/migrate-callers-then-delete-legacy-apis).** A new internal API while old callers exist. Migrate and delete in one wave.
- **[Separate Before Serializing Shared State](/principles/separate-before-serializing-shared-state).** Concurrent actors might write the same file, branch, key or object. Eliminate the sharing first.

## Verification

- **[Prove It Works](/principles/prove-it-works).** After a task, before declaring done. Verify against the real artifact, not a proxy or "it compiles". The proof is something the user can see.
- **[Fix Root Causes](/principles/fix-root-causes).** Debugging. Trace each symptom to its root cause, reproduce first, ask why until you reach it.
- **[Sequence work into verifiable units](/principles/sequence-verifiable-units).** Multi-step work and how you stack commits and PRs. Small units that each end in a check, verify each before the next.
- **[Test Behavior, Not Implementation](/principles/test-behavior-not-implementation).** Writing, changing or keeping a test. Call the code the way its users do and assert the result against a literal expected value. If the test would still pass when every imported function returns undefined, rewrite it or delete it.
- **[Explain the Number](/principles/explain-the-number).** Before you trust, report or act on a number you measured. Find what limits it, and rule out that it measured something other than the work you think.

## Delegation

- **[Guard the Context Window](/principles/guard-the-context-window).** Large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents, keep summaries in the main thread.
- **[Never Block on the Human](/principles/never-block-on-the-human).** Tempted to ask "should I do X?" on reversible work. Proceed, present the result, let the human course-correct. (Ideation is the deliberate exception.)

## Meta

- **[Encode Lessons in Structure](/principles/encode-lessons-in-structure).** You catch yourself writing the same instruction a second time. Encode it as a lint, type, test, CI check, hook (Claude Code or berth) or script instead of more text.
