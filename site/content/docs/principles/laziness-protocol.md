---
title: "Laziness Protocol"
description: "Refactoring, sizing a diff, or tempted to add abstractions, layers or signal threading. Bias to deletion and the smallest change that solves the problem."
---

**Applies when:** you refactor, judge a diff's size, or are tempted to add abstractions, layers, or signal threading.

Bias toward deletion and the smallest change that solves the problem.

- **Consolidate decisions.** Do not repeat the same choice in several places. Put it behind one source of truth and pass the result as a simple flag.
- **Minimize the diff.** Make the smallest change that solves the problem. Fewer lines beat "elegant" boilerplate.
