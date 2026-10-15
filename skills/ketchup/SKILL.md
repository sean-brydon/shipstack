---
name: ketchup
description: "Catch the user up on what changed in this chat since their last message, in a few plain sentences, with an artifact only where there is data or a screen to show. Give each action item just enough context to make the call. Use for /ketchup."
disable-model-invocation: true
---

# Ketchup

Catch the user up on what changed in this chat since the last message they wrote before `/ketchup`. System notifications and helper reports are not their messages. Assume the user remembers their last message and nothing after it.

Use the **bro** skill's voice, not its task: plain words, short sentences, no jargon, like one person catching up another. Say what changed for the user, not how you did it. Say "the tests pass", not "CI is green". Leave out hashes, file paths, commands, build numbers, and test counts unless the user needs one to act. Call each PR, branch, or agent by a name the user would know, not by a label you invented. If a fact needs context to make sense, give the context or leave the fact out.

## Gather what changed

Keep this turn read-only. Make artifacts only from what you already have: do not change code, start an app or a job, or post anything anyone else can see. Registering an artifact for the user (below) is fine. Collect your own work since that message, reports from helpers, and messages from anyone else in this chat. Check the current state of each PR, CI run, or agent this chat touched (`gh pr view`, `gh pr checks`, and your orchestration tool for agents running elsewhere). Check each number you will show against the facts it comes from, and say so when you correct one.

An action item is a decision or step only the user can take, such as a product choice, an approval, an irreversible action, or access you lack. Include any still waiting on the user, even one raised before their last message. Work you can still do yourself is not an action item. Never make up a call to fill the reply. A step the user did not ask for and the work does not need is not an action item, unless it is irreversible and waiting on the user: give it one action line, no artifact, and skip what happens if the user does not answer.

## Write the reply

Keep the whole reply well under 150 words, counting the words inside any table. Never give a fact in both the text and an artifact. Leave out work that changed nothing for the user. When words run short, cut from what happened before you cut from the action items.

Open with one sentence that says how many things need the user, or that nothing does. If nothing happened and nothing waits on the user, say so and stop.

Then say what happened, at most four things. Give each thing the user asked for one short sentence that says what came of it and whether it is done, still running, failed, or not checked. Write it the way you would say it out loud: "Search was slow from a missing index", not "Search review: done" or "Slow search: missing index". Name any bug found and fixed on the way. Each sentence must stay true when read alone. Never mark something done that still waits on the user. Then give at most three short lines that change what the user knows or must do. Then name in one line any work left that you can do yourself.

Then give each action item two lines, or one for an unasked irreversible step: the decision with your recommendation and why, then what happens if the user does not answer. Ask the call the user owns, such as merge, approve, or pick. A step you would take first goes in your recommendation. So does anything that must happen first, and anything that cannot be undone. Write "unknown" for a part you do not know. Link to the detail.

For a choice, lay the options out side by side: the current state beside each option, or the options alone when there is no current state, each with what it gets the user and what it costs. Put every option the work weighed there, and keep them out of the text. Skip this only for access requests and unasked irreversible steps.

## Artifacts

Make an artifact only when there is data or a screen to show. Otherwise the sentences above are the whole reply.

- **A visible change.** Show the screenshot or the visual diff you already have. Link the file or the artifact. If a visible change has no screenshot, say "No screenshot yet" in its sentence and what changed on screen. Never draw or describe a screen you did not capture as if you had.
- **Numbers.** A before and after, a trend, or a pass and fail count becomes a chart or a table. Make an artifact (a chart for numbers, a table for rows) when it is worth a page, else a markdown table of at most four rows.
- **A choice with weighed options.** When the options carry numbers or more than a line each, put the side-by-side in one small table artifact the same way. Otherwise a markdown table of the options in the reply.
- **States and flows.** A Mermaid diagram (as an artifact, or a Mermaid block in the reply) only when the flow is the news.

Keep each artifact small enough to read at a glance: at most six rows or boxes, at most eight words in each. Write labels as plain words a person would say, not tags like "Tests: pass". State where each number came from in the artifact's note or subtitle. Never invent a number. Link only artifacts that exist.
