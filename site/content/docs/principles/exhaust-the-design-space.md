---
title: "Exhaust the Design Space"
description: "A novel interaction or architectural decision with no precedent. Build 2-3 competing prototypes and compare before committing."
---

**Applies when:** you face a novel UI interaction or architectural decision with no precedent in the codebase.

Build 2-3 competing prototypes and compare them side by side before committing.

Build each prototype in its own worktree. With berth, make a berth task per prototype (the **berth-orchestrate** skill). Without berth, use the Agent tool with `isolation: "worktree"`. Compare what each one does, not what its author says it does. For UI, put screenshots of each side by side (the **berth-browser** skill inside berth, else the **claude-in-chrome** skill).

It also applies to product design decisions where user experience depends on feel, not logic.
