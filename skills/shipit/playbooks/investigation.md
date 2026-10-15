### Investigation

**You own the answer. Plan, route, write.**

Investigation requests are read-only. They produce a cited explanation or a recommendation, not a code change.

1. Route through the **how** skill (`<skills>/how/SKILL.md`). For motivation questions, also route through the **why** skill (`<skills>/why/SKILL.md`).
2. Throughput checkpoint stays one line: `throughput checkpoint: n/a, read-only investigation`.
3. Produce the `how`-shaped output (Overview / Key Concepts / How It Works / Where Things Live / Gotchas), or a recommendation with a tradeoffs table if the request is a decision between alternatives.
4. Make the evidence visible. When How It Works has more than a few hops, draw it as a Mermaid flowchart. When Where Things Live or the tradeoffs table runs past about 8 rows, or a decision rests on numbers you measured, make it an artifact (`.mmd` for the flow, `.csv` or `.md` for the table; see your adapter for how to publish it). Where artifacts are unavailable, put the Mermaid block or markdown table in the reply, or publish a page when the answer is worth one (load the artifact-design skill first if your environment has it). Every row cites its file and line, or the command that produced the number.
5. Apply the **unslop** skill (`<skills>/unslop/SKILL.md`) to the reply.

No PR, no babysit, no `architect` unless the investigation precedes a code change. If it does, hand back to the user and re-route to Bug fix or Feature.

**Reply:** the investigation output, with the diagram or table from step 4 linked or inline. For "are we sure?" answers, include your real judgment with reasons. Push back if the premise is wrong (see Autonomy).
