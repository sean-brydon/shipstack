import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";

const audit = join(import.meta.dir, "worktree-audit.sh");
const slug = (path: string) => path.replace(/[^A-Za-z0-9-]/g, "-");

let root = "";
let repo = "";
let projects = "";
let bin = "";

function sh(cwd: string, ...args: string[]) {
  const result = spawnSync(args[0], args.slice(1), {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@acme.test",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@acme.test",
    },
  });
  if (result.status !== 0) throw new Error(`${args.join(" ")}: ${result.stderr}`);
  return result.stdout;
}

function commitIn(worktree: string, file: string) {
  writeFileSync(join(worktree, file), file);
  sh(worktree, "git", "add", file);
  sh(worktree, "git", "commit", "-qm", file);
}

beforeAll(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), "worktree-audit-test-")));
  repo = join(root, "acme");
  projects = join(root, "projects");
  bin = join(root, "bin");
  mkdirSync(projects);
  mkdirSync(bin);
  sh(root, "git", "init", "-q", "--bare", "origin.git");
  sh(root, "git", "clone", "-q", "origin.git", "acme");
  sh(repo, "git", "checkout", "-q", "-b", "main");
  commitIn(repo, "a");
  sh(repo, "git", "push", "-q", "origin", "main");
  sh(repo, "git", "remote", "set-head", "origin", "main");

  sh(repo, "git", "worktree", "add", "-q", "../acme-merged", "-b", "merged", "main");
  sh(repo, "git", "worktree", "add", "-q", "../acme-wip", "-b", "wip", "main");
  writeFileSync(join(root, "acme-wip", "a"), "edited");
  sh(repo, "git", "worktree", "add", "-q", "../acme-chatted", "-b", "chatted", "main");
  commitIn(join(root, "acme-chatted"), "c");
  sh(repo, "git", "worktree", "add", "-q", "../acme-berth", "-b", "berthy", "main");
  commitIn(join(root, "acme-berth"), "b");
  sh(repo, "git", "worktree", "add", "-q", "../acme-idle", "-b", "idle", "main");
  commitIn(join(root, "acme-idle"), "i");

  const mainProject = join(projects, slug(repo), "abcdef12-0000");
  mkdirSync(mainProject, { recursive: true });
  writeFileSync(
    join(mainProject, "subagent.jsonl"),
    JSON.stringify({ cwd: `${root}/acme-chatted/` }) + "\n"
  );
  writeFileSync(
    join(projects, slug(repo), "99999999-noise.jsonl"),
    JSON.stringify({ text: `${root}/acme-merged-other/x ${root}/acme-idle\n` }) + "\n"
  );

  const berthd = join(bin, "berthd");
  writeFileSync(
    berthd,
    `#!/bin/sh
case "$1" in
locations) echo '${JSON.stringify([
      {
        name: "acme",
        path: repo,
        worktrees: [
          { name: "acme", path: repo, main: true },
          { name: "berthy", path: `${root}/acme-berth` },
        ],
      },
    ])}' ;;
sessions) echo '${JSON.stringify([
      { name: "acme-berthy-claude-1", dir: `${root}/acme-berth`, exited: false },
      { name: "old", dir: `${root}/acme-merged`, exited: true },
    ])}' ;;
esac
`
  );
  chmodSync(berthd, 0o755);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

function rows(withBerth: boolean) {
  const result = spawnSync("bash", [audit, "-b", "origin/main", repo], {
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PROJECTS: projects,
      BERTHD: withBerth ? join(bin, "berthd") : join(bin, "absent-berthd"),
    },
  });
  expect(result.status).toBe(0);
  const lines = result.stdout.trim().split("\n");
  expect(lines[1]).toBe(
    "SIZE\tAGE\tMERGED\tDIRTY\tREMOTE\tPR\tBERTH\tLAST_CHAT\tBUCKET\tWORKTREE"
  );
  return Object.fromEntries(
    lines.slice(2).map((line) => {
      const cells = line.split("\t");
      const name = cells[9].slice(root.length + 1);
      return [name, { berth: cells[6], chat: cells[7], bucket: cells[8], dirty: cells[3] }];
    })
  );
}

test("buckets merged, wip, chatted, idle, and berth worktrees", () => {
  const table = rows(true);
  expect(table["acme-merged"].bucket).toBe("safe");
  expect(table["acme-wip"]).toMatchObject({ dirty: "wip:1", bucket: "hold-wip" });
  expect(table["acme-chatted"].bucket).toBe("verify-recent-chat");
  expect(table["acme-chatted"].chat).toEndWith("/abcdef12");
  expect(table["acme-idle"]).toMatchObject({ chat: "-", bucket: "review" });
  expect(table["acme-berth"]).toMatchObject({
    berth: "acme/berthy",
    bucket: "hold-berth-session",
  });
});

test("falls back to plain git when berthd is absent", () => {
  const table = rows(false);
  expect(table["acme-berth"]).toMatchObject({ berth: "-", bucket: "review" });
  expect(table["acme-merged"].bucket).toBe("safe");
});
