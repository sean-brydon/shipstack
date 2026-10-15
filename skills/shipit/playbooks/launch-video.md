### Launch video

**You own the story and the review. The hyperframes skills own the craft.** From scratch, never Remotion. Nothing renders before the user approves the storyboard.

For a launch, promo, feature reveal or sizzle video. This playbook is the frame. The details live in the skills it routes to.

1. **Route to hyperframes.** Read the **hyperframes** skill (`~/.claude/skills/hyperframes/SKILL.md`) first. It is the entry point and picks the workflow. A product or feature launch usually lands in **product-launch-video**. A longer or freeform piece lands in **general-video**. Motion comes from **hyperframes-animation**, and music, sound, voice and imagery from **media-use**. Never Remotion, even when the project already has it.
2. **Play back the brief.** One sentence each for the audience, the one message, the length (short by default, 30 to 60 seconds), the aspect ratio, and where it ships. Answer the hyperframes intent questions from what you know. Ask only what you can't.
3. **Gather the real product.** The product's own SVGs, logo, icons, fonts, colors and tokens, and real screens of the real app (with the **berth-browser** skill, size the page with `berthd browser resize … --scale 2` or open it with `--scale 2`, then shoot, or use **claude-in-chrome**, with synthetic "acme" data). Reuse its design language. Don't invent UI the product doesn't have.
4. **Storyboard first.** Write the beats with timing, the script and on-screen text, the visual for each beat, and the music direction, in the hyperframes plan format (**hyperframes-core** covers `STORYBOARD.md` and `SCRIPT.md`). Publish it as an artifact (the **berth-artifacts** skill, or the `Artifact` tool) with stills or sketches per beat. Stop for approval. Changes here are cheap.
5. **Lock the music, then the cuts.** Pick the track through **media-use**. Detect its beats (`npx hyperframes beats <project-dir>`, see the **hyperframes-cli** skill) and land every cut and every major move on a beat.
6. **Build in its own lane.** Video work is long and high effort. Run it in a dedicated `shipit-agent` with the model and `effort` the Subagents section of `~/.claude/skills/shipit/SKILL.md` picks for the job, or a berth task, with the approved storyboard as its brief, in a directory or worktree of its own.
7. **Render and review frames.** Render, then pull stills at each beat (`npx hyperframes snapshot --at <t1>,<t2>,…`) and run `npx hyperframes check`. Look at every still against the storyboard for legibility, brand fidelity, timing on the beat, and jank between beats. Then sample the whole render at a fixed interval (every half second) to catch jumps between beats.
8. **Iterate.** Fix what the review found and re-render. Each round gets a contact sheet of stills in the artifact, next to the storyboard. Stop when the user approves the cut.

**Reply:** the rendered file's path, its length and aspect, the storyboard and contact-sheet artifact link, what changed from the storyboard and why, and anything left to decide (music license, voiceover, a missing asset).
