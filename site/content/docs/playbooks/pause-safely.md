---
title: "Pause safely"
description: "Suspend in-flight work cleanly so it can be resumed."
---

**You own a clean stop. Leave a checkpoint a cold-start agent can resume from.** This is explicit only. It covers an explicit pause, going offline, a Claude Code restart, or imminent context compaction. On "keep going", "going to bed, keep going", or "don't stop", do not pause.

1. Stop at a safe boundary. Finish the current atomic step or back out of it. Start nothing new, and cancel any nested subagents (`TaskStop` for local subagents and background commands). berth tasks you started keep running on their box and will not hear from you again, so list them in the resume note (name, worktree, what each was doing) rather than killing work worth keeping.
2. Take no irreversible action to pause. No PR and no push unless you already had one out.
3. Make the work durable. Commit uncommitted edits as one clear `wip:` commit on the current branch so nothing is lost. If the tree is broken, say so in the commit body in one line.
4. Write the resume note off-context. Capture intent, what you were doing, progress and what's verified, current state, next steps, key files, gotchas, and the berth tasks or background watchers still running. Write it to `~/.claude/shipit/resume/<slug>.md`, where [`~/.claude/skills/shipit/playbooks/session-pickup.md`](/playbooks/session-pickup) looks, and name the path in the reply. If a show-me-your-work trail exists, point at it instead of duplicating it.

**Reply:** where you are in the loop, what's on disk versus still in your head (paths, no diff dumps), the commits you made and whether the tree is clean, the resume note's path, and the first action on resume. This is a pause, not a final report.
