---
name: shipit-help
description: Guides users through shipit setup, /shipit, and picking the skill, playbook, or principle for a task. Type /shipit-help with a question.
disable-model-invocation: true
---

# shipit help

Answer the user's question about shipit, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a shipit run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use shipit to fix this bug", is not a help question. Read the **shipit** skill, do the work under it, and mention once that saying "stay in shipit mode" keeps it applying to later tasks in the chat.

This file maps questions to the skills and playbooks that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. Link the installed skill files, which the user can open.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask the user one question with these options, plus a free-text choice for "make shipit my own", then answer only the section they pick:

- Get set up
- Start a task with `/shipit`
- Pick a skill for a situation
- Fix a run that went wrong

Check the state that changes the answer, and mention it only when it does:

- No shipit models file (your adapter says where it lives) means `/setup-shipit` hasn't run for this user, so every role uses its default model and the `large` budget.
- No `verify-*` skill in the project's skills folder, and no other app harness, means agents have no scripted way to drive the app. Mention `/create-verification-skill` when the question is about proving a change works.
- An orchestration layer such as berth (optional) changes how parallel work and proof run. See the optional layer below.

When the models file is missing and it matters, ask whether the user wants to pick a model for each role and a reasoning budget now. It matters when the user is new, the question is about setup or cost, or the answer depends on which models run. Ask at most once per chat. If the need is also unclear, ask both questions together. Offer two choices:

- Now: give them `/setup-shipit` to type, and answer their question too.
- Later: answer their question, and add one line saying every role keeps its default model until they run `/setup-shipit`.

## Get set up

1. Install by running `install.sh` from the shipit repo. It symlinks every skill into each agent it finds (Claude Code, Codex), and Claude Code's helper agent files into its agents folder.
2. Run [`/setup-shipit`](../setup-shipit/SKILL.md). It asks for a reasoning budget, maps a model to each role, checks for other agents and berth, and writes the shipit models file. Skills read it at the start of each task.
3. Start a real task with `/shipit`, a goal, and a check that can pass or fail.

Installing changes nothing until the user invokes a skill. Most shipit skills load only when typed or when `/shipit` runs them. `/setup-shipit` also loads from the user's words. Offer to word their first prompt with them, per [`references/prompting.md`](references/prompting.md).

Long runs need fewer interruptions. A permission mode that lets the agent work, or an allowlist (see your adapter), keeps an overnight run from stalling on prompts. Irreversible actions still pause for the human.

If cost is the worry, say where the tokens go and how to spend fewer. shipit spends extra tokens on helpers and review panels. Rerun `/setup-shipit` and pick a smaller budget, which lowers every role's effort, or cheaper models. A role set to inherit runs on the chat's model. A shorter panel list runs fewer helpers, one for each entry. Save `/shipit` for work that needs rigor.

shipit is agent-agnostic. The skills say what to do in plain words, and an adapter says how to do it in a given agent. Adapters exist for Claude Code and Codex, and berth has an optional adapter that applies only when berth is present. On any other agent the skills still read as plain steps, and each step falls back to the plainest equivalent.

## Start a task with `/shipit`

`/shipit` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A step it skips stays in the list as `skip: <reason>`. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read [`references/prompting.md`](references/prompting.md) before you help word one.

`/shipit` attaches to one message, and it fades as the chat moves on. There is no persistent custom mode. To keep it on, start each task with `/shipit`, or say "stay in shipit mode" and the skill keeps applying. For a long run toward a check, repeat the prompt on an interval or self-paced (see your adapter).

Mid-chat, "new task" makes the mode match a fresh playbook. `/shipit` already briefs the delegates its playbook steps spawn to follow shipit's rules. To get the same style from a helper of your own, hand it that brief (your adapter says how).

## Pick a skill

The default answer is `/shipit`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | [`/shipit`](../shipit/SKILL.md) |
| Be questioned in rounds, each question with a recommended answer, until the plan is sharp, with settled terms and decisions recorded in a glossary and decision records | [`/grill`](../grill/SKILL.md) |
| Check that the agent understood their goal and the problem before it starts | [`/in-your-own-words`](../in-your-own-words/SKILL.md) |
| Aim a task higher before starting: more expert, more outcome-focused, not overspecified | [`/sharpen`](../sharpen/SKILL.md) |
| Know how code works now, or where new code should live | [`/how`](../how/SKILL.md) |
| Know why code is shaped this way, or where a number came from | [`/why`](../why/SKILL.md) |
| Understand a change or subsystem, explained plainly | [`/teach`](../teach/SKILL.md) |
| Catch up on their own recent work on a topic, from their session transcripts and saved memories | [`/recall`](../recall/SKILL.md) |
| Catch up on what changed in this chat since their last message, in a few plain sentences, with enough context to decide each action item | [`/ketchup`](../ketchup/SKILL.md) |
| Know what a small diff could break outside itself | [`/blast-radius`](../blast-radius/SKILL.md) |
| Settle types and module shape before code that crosses a function boundary | [`/architect`](../architect/SKILL.md) |
| Get several attempts at one brief, merged into the best one | [`/arena`](../arena/SKILL.md) |
| Run parallel checks over slices, or race workers, as helpers | [`/swarm`](../swarm/SKILL.md) |
| Have different models review a diff and try to break it | [`/interrogate`](../interrogate/SKILL.md) |
| Fix a bug test-first when a cheap local test exists | [`/tdd`](../tdd/SKILL.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`/typescript-best-practices`](../typescript-best-practices/SKILL.md) |
| Strip comments before review, using a reviewer that didn't write them | [`/no-comments`](../no-comments/SKILL.md) |
| Clean AI tells out of prose | [`/unslop`](../unslop/SKILL.md) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | [`/technical-writing`](../technical-writing/SKILL.md) |
| Hear the last reply again in plain words | [`/bro`](../bro/SKILL.md) |
| Give agents a scripted way to drive the app and prove behavior | [`/create-verification-skill`](../create-verification-skill/SKILL.md) |
| Bring a verification skill and its feature map back in line with the app | [`/maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| Vet a performance number before reporting or acting on it | [`/benchmark-checklist`](../benchmark-checklist/SKILL.md) |
| Run a large or cross-cutting change, or one to review after stepping away | [`/figure-it-out`](../figure-it-out/SKILL.md) |
| Keep a decision log during a run, and review it afterward as a table | [`/show-me-your-work`](../show-me-your-work/SKILL.md) |
| Pick a model for each role and a reasoning budget | [`/setup-shipit`](../setup-shipit/SKILL.md) |
| Turn their own working habits into a personal mode skill that routes through shipit | [`/automate-me`](../automate-me/SKILL.md) |
| Turn what a finished task taught into skill edits | [`/reflect`](../reflect/SKILL.md) |
| Stop agents from repeating the same mistakes in this repo, with types, lints and hooks | [`/correct`](../correct/SKILL.md) |
| Find their way around shipit | `/shipit-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description.

Close calls:

- `/how` explains what the code does. `/why` explains the reasons. `/teach` runs one or both and explains the result plainly.
- `/arena` gives every worker the same brief and merges the best parts. `/swarm` splits work into slices or a race and returns one report.
- `/architect` implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- `/interrogate` reviews the diff. `/blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `/recall` rebuilds context across recent chats. `/ketchup` covers only this chat since the user's last message. Resuming one specific chat or branch is the Session pickup playbook.
- `/figure-it-out` designs one rigorous run. The Autonomous run playbook drives one task to a finish condition.
- `/reflect` turns one session's lessons into skill edits. `/correct` makes a repeated mistake in the repo impossible.

Built-ins your agent may have, which shipit uses when present (see your adapter):

- A cleanup pass and a local review pass over the diff before commit. Without them, shipit does both by hand.
- A way to run a prompt on an interval or self-paced.
- A permission allowlist builder, and a way to write hooks, which `/correct` uses.

## The optional berth layer

When berth is present (any `BERTH_*` variable in the environment, or its CLI on PATH), shipit reads the berth adapter on top of the agent's own. It changes how a few things run, and each has a plain fallback when berth is absent:

| What shipit does | With berth | Without berth |
|---|---|---|
| Parallel runners and prototypes | A berth task each, in its own worktree with its own port, reporting back by notification | A writing helper per runner in its own worktree |
| Driving the page to repro a bug or prove a fix | The worktree's own page in berth's headless browser | The project's Playwright, or whatever browser driver the agent has |
| Before and after screenshots across widths, light and dark | berth's visual diff | Screenshots from the browser driver |
| Showing the user the running page | A preview tab beside the chat | A local URL in the reply |
| Charts, tables, diagrams and plans (hillclimb logs, decision logs, rule tables, coverage) | berth's artifacts | An artifact the agent can make, or a markdown table |
| A gate that refuses an action, used by `/correct` | A `before:` hook in the repo's berth config | A hook in the agent, if it has them |

The berth adapter has the commands. The skills never name them.

## Playbooks and principles

Playbooks are step lists inside `/shipit`, not skills, so they have no slash command. They live in the `playbooks/` folder of the shipit skill: investigation, bug-fix, perf-issue, hillclimb, runtime-forensics, trace-forensics, feature, refactoring, prototype, visual-parity, authoring-a-skill, eval, babysit, shipping, autonomous-run, session-pickup, pause-safely, worktree-cleanup, opening-a-pr, ideation, research, and design-audit. More may be added. The Playbooks section of the shipit skill has the current list and when each applies.

Inside `/shipit`, describing the task picks one, and these phrases name one directly:

- "babysit this pr" or "check on pr 123" runs Babysit. It drives the PR to merge-ready and stops there. It doesn't merge unless the user asks to merge, land, or ship.
- "land the stack" runs Shipping.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "run the eval playbook" runs Eval.

shipit has no planning skill. Your agent's plan mode, if it has one, works alongside it. For work that spans phases or many PRs, `/shipit` routes to the **figure-it-out** skill, which designs the run before anything is built. For a design question, the Prototype playbook or `/architect` settles it in code first.

Principles are one-rule files in the `principles/` folder of the shipit skill that `/shipit` reads and cites in its replies. They are not skills, so they have no slash command and cost no context until read. The user steers with the names instead, as in "apply prove it works. show me the real output." The Principles section of the shipit skill lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The mode stopped applying after a few turns | `/shipit` attaches to one message. Start each task with `/shipit`, or say "stay in shipit mode". |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | Skills read the shipit models file at the start of a task. Start a new task. Check the line's role label matches the one `/setup-shipit` writes. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | Most shipit skills load only when the user types them or when `/shipit` runs them, and it doesn't run every skill. |
| Parallel agents overwrote each other | Give each agent its own worktree (a writing helper per worktree, or a berth task each if berth is present). |
| An overnight run kept stopping for permission | Use a permission mode that lets the agent work, or build an allowlist (see your adapter). |
| An overnight run moved but finished nothing | A loop needs a check that can pass or fail, not a duration. |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or screenshot. That's the prove-it-works principle. |
| The reply is a wall of numbers | Ask for an artifact: a chart or table the user can open. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers.

## Make shipit my own

- [`/automate-me`](../automate-me/SKILL.md) drafts a personal mode skill from the user's own session transcripts and saved memories, to use alongside `/shipit`.
- [`/reflect`](../reflect/SKILL.md) after a session turns its lessons into skill edits the user approves.
- [`/correct`](../correct/SKILL.md) turns a repeated correction into a type, lint, hook or test.
- `/shipit write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
