---
title: "Skills"
description: "The 29 skills in the stack."
---

Every skill in the stack, one page each, generated from `skills/*/SKILL.md`. You can type any of them. Most set `disable-model-invocation`, so their descriptions stay out of your sessions' context and `/shipit` reaches them by reading the file.

## Route and configure

- **[/shipit](/skills/shipit).** Rigorous engineering mode for Claude Code and berth. Routes the task to a playbook, applies the principles, delegates deliberately, proves the work with artifacts, and writes clean replies. Use for /shipit or "work in shipit mode".
- **[/setup-shipit](/skills/setup-shipit).** Configure which model shipit uses per role and at what reasoning budget, and detect codex and berth. Writes ~/.claude/shipit/models.md, which overrides the skill defaults. Use for /setup-shipit, "configure shipit models", "shipit budget", or changing shipit's model choices.
- **[/shipit-help](/skills/shipit-help).** Guides users through shipit setup, /shipit, and picking the skill, playbook, or principle for a task. Type /shipit-help with a question.

## Understand

- **[/how](/skills/how).** Use for "how does X work", code walkthroughs before changing something, and placement / ownership / layering questions ("where should this live", "which package owns this", "is this the right layer"). Explains subsystem architecture and runtime flow. Use why for motivation.
- **[/why](/skills/why).** Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Queries every available evidence source (git, tickets, docs, chat, observability, error tracking, analytics) in parallel and returns a cited, confidence-tiered read. Use how for runtime behavior.
- **[/teach](/skills/teach).** Explain a body of work plainly so a person actually understands it. Runs the how and why skills and weaves what they find into one clear explanation. Use for 'teach me this', 'help me really understand X', 'explain this change or subsystem to me'.
- **[/recall](/skills/recall).** Reconstruct your recent working context from your own Claude Code chat history, project memory, live state, and the shared record (user reports, prior fixes, incidents), then hand back a tight current-state brief. Use for 'recall my work on X', 'catch me up', 'what have I been working on', 'where did I leave off', before starting or resuming work.
- **[/ketchup](/skills/ketchup).** Catch the user up on what changed in this chat since their last message, in a few plain sentences, with an artifact only where there is data or a screen to show. Give each action item just enough context to make the call. Use for /ketchup.

## Design and review

- **[/architect](/skills/architect).** Sketch types, signatures, and module structure before code, then stay in the loop while implementation fills in. Use for /architect, 'architect this', 'design this', or non-trivial work where jumping to code would lock in the wrong shape.
- **[/arena](/skills/arena).** Spawn N parallel candidates at the same task in isolated worktrees, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape.
- **[/swarm](/skills/swarm).** Fan out N parallel workers, drain them, and return one report with a coverage table. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration.
- **[/interrogate](/skills/interrogate).** Use for "interrogate", "adversarial review", "multi-model review", "challenge this", "stress test this code", "find blind spots", or "tear this apart". Reviewers on different model families challenge changes from independent angles, then a lead verdict sorts the findings.
- **[/blast-radius](/skills/blast-radius).** Find what a change could break somewhere else before it ships, beyond the diff, and prove the one fact it's safe because of by running real code instead of writing it up. Use for 'blast radius of X', 'what could this break', or reviewing a small diff you don't trust.

## Build and clean

- **[/tdd](/skills/tdd).** Use only when the user explicitly asks for TDD, a failing test, or a regression test, OR when the bug has an obvious cheap local test target. Skip when the test path is unclear, expensive, integration-heavy, or not requested.
- **[/benchmark-checklist](/skills/benchmark-checklist).** Vet a perf measurement (limiter, tuning, limits, errors, repeatability, relevance, and whether the work happened) before you report or act on it, and report it as a chart or table with its source command. Use when you run a benchmark or report a speedup or regression you measured.
- **[/no-comments](/skills/no-comments).** Spawn Comment Sicko, fix accepted findings, and offer encodings for claimed constraints.
- **[/unslop](/skills/unslop).** Cut AI tells from any writing.
- **[/technical-writing](/skills/technical-writing).** Layered technical-writing standard: Diátaxis structure, Google developer style sentences, STE instruction rules, Global English syntax. Use for /technical-writing or when writing or reviewing docs, RFCs, readmes, PR descriptions, or commit messages.

## Improve the stack

- **[/reflect](/skills/reflect).** Spawn three parallel review subagents over the active Claude Code transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
- **[/correct](/skills/correct).** Find the mistakes agents keep repeating in this repo and make each one impossible. Try architecture first, then types, then a lint or hook whose error names the fix, then a test, and write memory or docs last. Prove each check fails on a real past mistake. Repeat this each time the operator corrects you. Use for /correct.
- **[/automate-me](/skills/automate-me).** Use for "automate me", "create/update/refresh my -mode skill", "turn/capture my preferences or working style into a skill", or wanting agents to follow how the user works. Drafts or revises a personal -mode skill that routes through shipit, mined from the user's Claude Code transcripts and memory.
- **[/show-me-your-work](/skills/show-me-your-work).** Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision (what, why, evidence, result), shown as a table artifact for review. Local by default; commit it when a reviewer needs the trail to trust the result. Use for /show-me-your-work, autonomous or multi-phase runs, or work a human reviews after stepping away.
- **[/figure-it-out](/skills/figure-it-out).** Design an auditable playbook when no narrower one fits, such as a large migration, an ambitious multi-part change, or work a human reviews after stepping away. Scales rigor to the task, runs a hypothesis loop, and logs decisions. Use for /figure-it-out or 'figure it out'.
- **[/create-verification-skill](/skills/create-verification-skill).** Generate a project-local verification skill that drives your app the way a user does and saves proof a PR can embed, for any language, framework, or platform. Use for /create-verification-skill, "make a verify skill for this repo", or when a project has no scripted way to prove UI, CLI, or service behavior.
- **[/maintain-verification-skill](/skills/maintain-verification-skill).** Periodic pass that keeps a project's verification skill and feature map honest: parallel source readers per feature, one live session driving every feature, at most one PR of proven corrections. Use for /maintain-verification-skill or "audit the verify skill".

## More

- **[/bro](/skills/bro).** Restate the last message in plain human language, with no jargon.
- **[/in-your-own-words](/skills/in-your-own-words).** Restate in your own words what you think the user's goals are and what problem they're trying to solve. Use for /in-your-own-words.
- **[/sharpen](/skills/sharpen).** Sharpen a task before starting: the expert approach, what the user is really after, and the right level of specification. Use for /sharpen.
- **[/typescript-best-practices](/skills/typescript-best-practices).** TypeScript best practices. Use when reading or editing any .ts or .tsx file.
