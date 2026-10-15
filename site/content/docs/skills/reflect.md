---
title: "/reflect"
description: "Spawn three parallel review subagents over the active Claude Code transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect."
---

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Before fanning out, find this conversation's transcript in the active project's directory, `~/.claude/projects/<slug>/` (the slug rule and the record shapes are in `~/.claude/skills/recall/references/transcripts.md`). Do not glob across `~/.claude/projects/*/`. That crosses workspace boundaries and reads private chats from unrelated projects.

```bash
slug=$(printf '%s' "$PWD" | sed 's/[^A-Za-z0-9-]/-/g')
ls ~/.claude/projects/"$slug"/"$CLAUDE_CODE_SESSION_ID".jsonl 2>/dev/null \
  || ls -t ~/.claude/projects/"$slug"/*.jsonl | head -10
```

`$CLAUDE_CODE_SESSION_ID` names this chat's file when it is set. Otherwise, for each candidate, pull the first human turn with the filter in `transcripts.md` and take the file whose first human turn is this conversation's opening prompt. The chat's subagents are in `<session-id>/subagents/agent-*.jsonl`, and reviewers read them when a finding hinges on what a delegate did. If no file matches, pass a tight digest of the session instead.

## 2. Spawn three reviewers in parallel

One message, three `Agent` calls, `subagent_type: "general-purpose"`. Reviewers need MCP access to look up the tickets, chat threads, and observability traces the transcript references. They run in the background and notify on completion. End your turn instead of polling.

Each reviewer and the synthesizer name a role line in `~/.claude/shipit/models.md` and a default. Set `model` to that line's value, or to the default if the file or the line is missing. Leave `model` unset when the value is `inherit`. When the value is `codex`, run the same prompt with `codex exec -s read-only -o <out-file> "<prompt>"` in a background Bash and read `<out-file>` when it finishes. Codex has no access to your MCP tools, so say which lookups it skipped. Set each subagent's `effort` for the job, per the Subagents section of the **shipit** skill ([`~/.claude/skills/shipit/SKILL.md`](/skills/shipit)).

| Lens | Role line | Default `model` | Prompt template |
|---|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `opus` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `sonnet` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `opus` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in their final report.

## 3. Synthesize

One `Agent` call, `subagent_type: "general-purpose"`, `model` from the `reflect judgment, divergent, synthesizer` line (default `opus`). It spot-verifies citations through MCP. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, hook, or runtime check would enforce more reliably to Backlog. See the **Encode Lessons in Structure** principle ([`~/.claude/skills/shipit/principles/encode-lessons-in-structure.md`](/principles/encode-lessons-in-structure)). The **correct** skill builds that kind of enforcement when the user wants it now.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. Inside berth, register it as a notes artifact with the **berth-artifacts** skill (`berthd artifact add reflect.md --title "Reflect: proposed skill edits"`), since it is a plan the user approves row by row. Outside berth, put it in the reply. The user picks the subset and may redirect routings. Skill changes affect every future agent that loads them. Do not auto-apply.

Present the Backlog items with the Accepted list and file them only on the user's go. Never run `gh issue create` (or file to any tracker) without approval.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): run the Authoring a skill playbook ([`~/.claude/skills/shipit/playbooks/authoring-a-skill.md`](/playbooks/authoring-a-skill)) and its draft / test / iterate loop. The `anthropic-skills:skill-creator` skill, if installed, helps with the loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): run the same playbook's description work. Claude Code shows every description in every session, so the edit makes the trigger sharper, not the description longer.
- `new skill via authoring playbook: <kebab-name>`: hand creation to the Authoring a skill playbook. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
