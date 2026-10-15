---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Reviewers on different model families challenge changes from independent angles, then a lead verdict sorts the findings."
disable-model-invocation: true
---

# Interrogate

Spawn one reviewer per configured model to adversarially review code changes. The adversarial signal comes from model diversity, not assigned personas. The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that.
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset.
- If the user's message references recent work, gather the relevant files.

Package the diff or file contents with any surrounding context files the reviewers need to understand the code. For a large diff, write it to a file and pass the path rather than inlining it.

## Step 2, Intent

Before spawning reviewers, state the intent in one clear paragraph from the user's message, commit messages, the PR description if one exists, and the code. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch all reviewers in a single message, one per entry on the `interrogate reviewers` line in `~/.claude/shipit/models.md`, labeled Reviewer A, B, and so on to match the entry count. If the file or that line is missing, use the table defaults.

| Reviewer | Default model |
|----------|---------------|
| Reviewer A | `opus` |
| Reviewer B | `sonnet` |
| Reviewer C | `fable` |

Each reviewer is an Agent tool subagent with `subagent_type: "general-purpose"`, a prompt that says it must not edit files, and `model` set to its configured entry, or its table default when there is no configured line. Omit `model` for an `inherit` entry, so that reviewer runs on the parent model. If the Agent tool rejects an entry, run that reviewer on Reviewer A's default and say so. Do not block the review on it.

A `codex` entry runs that reviewer on Codex. Write its filled prompt to a file and run `codex exec -s read-only -C <repo root> -o <answer file> - < <prompt file>` in Bash with `run_in_background: true`. On a berth box, `berthd run start --template review --param session=<name>` (a read-only reviewer of that session's worktree) or a berth session with `--agent codex` and a "do not edit files" prompt work too (see the **berth-orchestrate** skill). If `codex` is not on PATH, run that reviewer on Reviewer A's default and say so.

Read `references/reviewer-prompt.md` and fill in the same template for every reviewer with the stated intent, the diff or file contents, the rubric from `references/rubric.md`, and the code-quality lens from `references/code-quality-review.md`. Set each reviewer's `effort` from the budget line in `~/.claude/shipit/models.md` (`unlimited` max, `large` xhigh, `medium` high, `small` medium, default `large`), then adjust it for the job per the Subagents section of the **shipit** skill (`~/.claude/skills/shipit/SKILL.md`). Keep each entry's model family, so the panel stays diverse.

The reviewers run in the background. End your turn and let them report back. Don't poll.

## Step 4, Synthesize

As results come back, build a unified picture. Parse every reviewer's findings. Merge findings that describe the same issue differently, and note which models raised each one. Findings two or more models raised independently are the highest signal. Read a lone model's finding, but weight it accordingly. Note disagreements. If one model flags something and another explicitly says the opposite, that is context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. Read `references/lead-judgment.md` for the full framework. Put every finding in one of four buckets, with the model(s) that raised it and a one-line rationale.

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider**. Legitimate, but you're not sure they outweigh the cost of addressing them now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact at this stage.
- **Dismissed**. Wrong, nitpicky, or missing context, with a brief reason.

## Output Format

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [model name and effort], [N findings] (one bullet per reviewer)

### Act On
[Each: description, which models raised it, why it matters.]

### Consider
[Each: description, which models raised it, the tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a brief rationale.]

### Agreement Map
[Where models agreed and diverged, and what that pattern tells us.]

Back the Agreement Map with a findings table. It has one row per merged finding, with its bucket, severity, `file:line`, and one column per reviewer marking whether that model raised it. When the table has more than about eight rows, show it as an artifact. Inside berth, write it as a CSV outside the repo's tracked files and register it with `berthd artifact add <file>.csv --title "Interrogate: <change>"` (see the **berth-artifacts** skill). Outside berth, publish it with the `Artifact` tool (load the **artifact-design** skill first) or put it in the reply as a markdown table. Name the diff it reviewed (base and head SHAs) under the table.
