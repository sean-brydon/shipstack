#!/usr/bin/env node
// Generates the reference pages (playbooks, skills, principles) from the
// repo's markdown into content/docs/. Runs as `prebuild` and by hand
// (`pnpm sync`). The output is committed, so a deploy that uploads only
// site/ still builds: when ../skills is missing this script does nothing.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = dirname(dirname(fileURLToPath(import.meta.url)));
const repo = dirname(site);
const skillsDir = join(repo, 'skills');
const out = join(site, 'content', 'docs');
const githubBlob = 'https://github.com/sean-brydon/shipstack/blob/main';

if (!existsSync(join(skillsDir, 'shipit', 'SKILL.md'))) {
  console.log('sync-content: ../skills not found, keeping the committed pages.');
  process.exit(0);
}

const read = (p) => readFileSync(p, 'utf8');
const kebab = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const list = (dir, ext) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => f.slice(0, -ext.length))
    .sort();

// ---------------------------------------------------------------- inventory

const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(skillsDir, d.name, 'SKILL.md')))
  .map((d) => d.name)
  .sort();
const playbooks = list(join(skillsDir, 'shipit', 'playbooks'), '.md');
const principles = list(join(skillsDir, 'shipit', 'principles'), '.md');

// Repo path (posix, from the repo root) to site URL, for pages that exist.
function pageFor(repoPath) {
  let m = repoPath.match(/^skills\/([^/]+)\/SKILL\.md$/);
  if (m && skills.includes(m[1])) return `/skills/${m[1]}`;
  m = repoPath.match(/^skills\/shipit\/playbooks\/([^/]+)\.md$/);
  if (m && playbooks.includes(m[1])) return `/playbooks/${m[1]}`;
  m = repoPath.match(/^skills\/shipit\/principles\/([^/]+)\.md$/);
  if (m && principles.includes(m[1])) return `/principles/${m[1]}`;
  return null;
}

// A path as the skills write it in a code span, to a repo path.
function codePathToRepo(code) {
  let m = code.match(/^~\/\.claude\/skills\/(.+)$/);
  if (m) return `skills/${m[1]}`;
  m = code.match(/^(playbooks|principles)\/([a-z0-9-]+\.md)$/);
  if (m) return `skills/shipit/${m[1]}/${m[2]}`;
  return null;
}

// ---------------------------------------------------------------- frontmatter

function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      try {
        v = JSON.parse(v);
      } catch {
        v = v.slice(1, -1);
      }
    } else if (v.startsWith("'") && v.endsWith("'")) {
      v = v.slice(1, -1).replace(/''/g, "'");
    }
    data[kv[1]] = v;
  }
  return { data, body: text.slice(m[0].length) };
}

const yaml = (v) => JSON.stringify(String(v));
function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${yaml(v)}`);
  return `---\n${lines.join('\n')}\n---\n\n`;
}

// Inline markdown to plain text, for descriptions.
const plain = (s) =>
  s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

// ---------------------------------------------------------------- body

// Drop the first heading when it opens the file: it becomes the page title.
function takeTitle(body) {
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  const m = lines[i]?.match(/^#{1,6}\s+(.+?)\s*#*$/);
  if (!m) return { title: null, body };
  return { title: m[1].trim(), body: lines.slice(i + 1).join('\n').replace(/^\n+/, '') };
}

// Rewrites links and makes the text safe for the MDX compiler: a bare `<`
// outside code becomes `&lt;` and braces are escaped, so `<name>` and
// `{ a }` show as typed.
function convert(body, srcRepoPath) {
  const srcDir = posix.dirname(srcRepoPath);
  const lines = body.split('\n');
  let fence = null;
  return lines
    .map((line) => {
      const f = line.match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        if (f && f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
        return line;
      }
      if (f) {
        fence = f[1];
        return line;
      }
      // MDX has no indented code blocks, so indented lines are text too.
      return convertInline(line, srcDir);
    })
    .join('\n');
}

function convertInline(line, srcDir) {
  // Split into code spans and text.
  const parts = [];
  const re = /(`+)([\s\S]*?[^`])\1(?!`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    parts.push({ text: line.slice(last, m.index) });
    parts.push({ code: m[0], inner: m[2] });
    last = m.index + m[0].length;
  }
  parts.push({ text: line.slice(last) });

  let result = '';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.text !== undefined) {
      result += convertText(p.text, srcDir);
      continue;
    }
    // A code span that names a file with a page becomes a link, unless it
    // already sits inside one.
    const before = parts[i - 1]?.text ?? '';
    const after = parts[i + 1]?.text ?? '';
    const inLink = before.endsWith('[') && after.startsWith('](');
    const target = codePathToRepo(p.inner.trim());
    const url = target && !inLink ? pageFor(target) : null;
    result += url ? `[${p.code}](${url})` : p.code;
  }
  return result;
}

function convertText(text, srcDir) {
  return text
    .replace(/<(https?:\/\/[^>\s]+)>/g, '[$1]($1)')
    .replace(/</g, '&lt;')
    .replace(/[{}]/g, (c) => `\\${c}`)
    .replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (all, href, title = '') => {
      if (/^(https?:|mailto:|#|\/)/.test(href)) return all;
      const [path, hash] = href.split('#');
      const resolved = posix.normalize(posix.join(srcDir, path));
      const page = pageFor(resolved);
      const url = page ?? `${githubBlob}/${resolved}`;
      return `](${url}${hash ? `#${hash}` : ''}${title})`;
    });
}

// ---------------------------------------------------------------- router index

const router = read(join(skillsDir, 'shipit', 'SKILL.md'));

function section(text, heading) {
  const start = text.indexOf(`\n## ${heading}\n`);
  if (start < 0) return '';
  const rest = text.slice(start + heading.length + 5);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
}

// Groups of `- **Name.** what it is for` entries, as the router lists them.
function routerEntries(text, kind, known) {
  const groups = [];
  let group = null;
  for (const line of text.split('\n')) {
    const g = line.match(/^\*\*([^*]+)\*\*\s*$/);
    if (g) {
      group = { title: g[1].trim(), items: [] };
      groups.push(group);
      continue;
    }
    const e = line.match(/^- \*\*(.+?)\.?\*\*\.?\s*(?:\(`([a-z]+\/[a-z0-9-]+\.md)`\)\.?)?\s*(.*)$/);
    if (!e || !group) continue;
    let [, name, explicit, desc] = e;
    const fileRef = desc.match(/File `[a-z]+\/([a-z0-9-]+)\.md`\.?/);
    desc = desc.replace(/\s*File `[^`]+`\.?/, '').trim();
    const slug = explicit ? explicit.split('/')[1].replace(/\.md$/, '') : fileRef ? fileRef[1] : kebab(name);
    if (!known.includes(slug)) {
      console.warn(`sync-content: the router names ${kind} "${name}" but ${kind}s/${slug}.md is missing`);
      continue;
    }
    group.items.push({ slug, name: name.replace(/\.$/, ''), desc: plain(desc) });
  }
  const listed = new Set(groups.flatMap((g) => g.items.map((i) => i.slug)));
  const rest = known.filter((s) => !listed.has(s));
  if (rest.length) groups.push({ title: 'More', items: rest.map((slug) => ({ slug, name: null, desc: '' })) });
  return groups;
}

const playbookGroups = routerEntries(section(router, 'Playbooks'), 'playbook', playbooks);
const principleGroups = routerEntries(section(router, 'Principles'), 'principle', principles);

// ---------------------------------------------------------------- tldr

// The human summary on top of each page: content/tldr.json holds the skills
// (keyed by name) and playbooks (keyed by file slug). A principle's rule is
// the router's one-line entry, after its "applies when" sentence.
const tldr = JSON.parse(read(join(site, 'content', 'tldr.json')));
for (const name of skills) if (!tldr.skills[name]) console.warn(`sync-content: no tldr for skill ${name}`);
for (const slug of playbooks) if (!tldr.playbooks[slug]) console.warn(`sync-content: no tldr for playbook ${slug}`);

// Plain text from tldr.json, safe in MDX prose.
const mdx = (s) => s.replace(/</g, '&lt;').replace(/[{}]/g, (c) => `\\${c}`);
const sentence = (s) => (/[.!?)"]$/.test(s) ? s : `${s}.`);
const cell = (s) => mdx(s).replace(/\|/g, '\\|');

function principleRule(desc) {
  const m = desc.match(/^(.+?\.)\s+(.+)$/);
  return m ? { when: m[1], rule: m[2] } : { when: '', rule: desc };
}

const collapsed = (body) =>
  `<details className="ss-full">\n<summary>Full instructions (what the agent reads)</summary>\n\n${body.trim()}\n\n</details>\n`;

const invokeLabel = { type: 'type it', auto: 'loads itself', model: 'type it or ask' };
const tierLabel = (t) => (t === 'varies' ? 'cost varies' : `${t} cost`);

function skillTldr(t) {
  if (!t) return '';
  const lines = [
    `<p className="ss-badges"><span className="ss-badge">${invokeLabel[t.invoke] ?? t.invoke}</span><span className="ss-tier" data-tier="${t.tier}">${tierLabel(t.tier)}</span></p>`,
    `**What it does.** ${mdx(t.what)}`,
    `**Use when.** ${mdx(sentence(t.use))}`,
  ];
  if (t.skip) lines.push(`**Skip when.** ${mdx(sentence(t.skip))}`);
  if (t.prompt && t.prompt !== '(automatic)') lines.push('```text\n' + t.prompt + '\n```');
  lines.push(`**You get.** ${mdx(sentence(t.get))}`);
  if (t.where && t.where !== 'It is the router') {
    lines.push(
      t.where === 'Type it'
        ? '**In /shipit.** No playbook calls it. You type it.'
        : `**In /shipit.** ${mdx(sentence(t.where))}`,
    );
  }
  return `${lines.join('\n\n')}\n\n`;
}

function playbookTldr(t) {
  if (!t) return '';
  return `**What it does.** ${mdx(t.what)}\n\n**Say something like.** ${mdx(t.say)}\n\n`;
}

// ---------------------------------------------------------------- write

function resetDir(name) {
  const dir = join(out, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeMeta(dir, title, groups) {
  const pages = ['index'];
  for (const g of groups) {
    pages.push(`---${g.title}---`);
    pages.push(...g.items.map((i) => (typeof i === 'string' ? i : i.slug)));
  }
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify({ title, pages }, null, 2)}\n`);
}

function table(head, rows) {
  return `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
}

let count = 0;

// Playbooks.
{
  const dir = resetDir('playbooks');
  const titles = {};
  for (const slug of playbooks) {
    const src = `skills/shipit/playbooks/${slug}.md`;
    const { title, body } = takeTitle(read(join(repo, src)));
    const t = tldr.playbooks[slug];
    titles[slug] = title ?? t?.name ?? slug;
    writeFileSync(
      join(dir, `${slug}.mdx`),
      frontmatter({ title: titles[slug], description: t?.what }) + playbookTldr(t) + collapsed(convert(body, src)),
    );
    count++;
  }
  let index =
    '**What it is.** The checklist `/shipit` follows for one kind of task. You describe the task; it picks the playbook and copies the steps into its todo list.\n\n**Why.** The same kind of task gets the same steps every time, and a skipped step shows as `skip: <reason>`.\n';
  for (const g of playbookGroups) {
    index += `\n## ${g.title}\n\n`;
    index += table(
      ['playbook', 'what it does'],
      g.items.map((i) => [`[${titles[i.slug]}](/playbooks/${i.slug})`, cell(tldr.playbooks[i.slug]?.what ?? i.desc)]),
    );
  }
  writeFileSync(join(dir, 'index.mdx'), frontmatter({ title: 'Playbooks', description: `The ${playbooks.length} playbooks /shipit routes tasks to.` }) + index);
  writeMeta(dir, 'Playbooks', playbookGroups);
}

// Principles.
{
  const dir = resetDir('principles');
  const info = new Map(principleGroups.flatMap((g) => g.items.map((i) => [i.slug, i])));
  const titles = {};
  const rules = {};
  for (const slug of principles) {
    const src = `skills/shipit/principles/${slug}.md`;
    const { title, body } = takeTitle(read(join(repo, src)));
    titles[slug] = title ?? info.get(slug)?.name ?? slug;
    let rule = info.get(slug)?.desc ? principleRule(info.get(slug).desc).rule : '';
    if (!rule) {
      const applies = body.match(/\*\*Applies when:\*\*\s*(.+)/);
      rule = applies ? plain(applies[1]) : '';
    }
    rules[slug] = rule;
    const head = rule ? `**The rule.** ${mdx(rule)}\n\n` : '';
    writeFileSync(join(dir, `${slug}.mdx`), frontmatter({ title: titles[slug], description: rule }) + head + collapsed(convert(body, src)));
    count++;
  }
  let index =
    '**What it is.** One-rule files `/shipit` reads when a decision calls for one, and names in its reply.\n\n**Why.** They cost no context until one applies, and you can steer by name ("apply prove it works").\n';
  for (const g of principleGroups) {
    index += `\n## ${g.title}\n\n`;
    index += table(['principle', 'the rule'], g.items.map((i) => [`[${titles[i.slug]}](/principles/${i.slug})`, cell(rules[i.slug])]));
  }
  writeFileSync(join(dir, 'index.mdx'), frontmatter({ title: 'Principles', description: `The ${principles.length} principles /shipit applies and cites.` }) + index);
  writeMeta(dir, 'Principles', principleGroups);
}

// Skills, grouped as tldr.json lists them; the rest go under "More".
{
  const dir = resetDir('skills');
  const skillGroups = [];
  for (const [name, t] of Object.entries(tldr.skills)) {
    if (!skills.includes(name)) continue;
    let g = skillGroups.find((x) => x.title === t.group);
    if (!g) skillGroups.push((g = { title: t.group, items: [] }));
    g.items.push(name);
  }
  const rest = skills.filter((s) => !tldr.skills[s]);
  if (rest.length) skillGroups.push({ title: 'More', items: rest });

  const descs = {};
  for (const name of skills) {
    const src = `skills/${name}/SKILL.md`;
    const { data, body: raw } = splitFrontmatter(read(join(repo, src)));
    const { body } = takeTitle(raw);
    const t = tldr.skills[name];
    descs[name] = t?.what ?? plain(data.description ?? '');
    writeFileSync(
      join(dir, `${name}.mdx`),
      frontmatter({ title: `/${name}`, description: descs[name] }) + skillTldr(t) + collapsed(convert(body, src)),
    );
    count++;
  }
  let index =
    '**What it is.** Every skill in the stack. You can type any of them; `/shipit` calls most of them for you.\n\n**Why.** Each one does one job well, so a playbook can sequence them and you can reach for one directly.\n';
  for (const g of skillGroups) {
    index += `\n## ${g.title}\n\n`;
    index += table(
      ['skill', 'what it does', 'cost'],
      g.items.map((name) => [`[/${name}](/skills/${name})`, cell(descs[name]), tldr.skills[name]?.tier ?? '']),
    );
  }
  writeFileSync(join(dir, 'index.mdx'), frontmatter({ title: 'Skills', description: `The ${skills.length} skills in the stack.` }) + index);
  writeMeta(dir, 'Skills', skillGroups);
}

console.log(
  `sync-content: wrote ${count} pages (${playbooks.length} playbooks, ${skills.length} skills, ${principles.length} principles) to ${relative(site, out)}/`,
);
