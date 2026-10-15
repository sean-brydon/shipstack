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

// Rewrites links and makes the text safe for the markdown compiler: a bare
// `<` outside code becomes `&lt;`, so `<name>` shows as typed.
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
      if (/^( {4}|\t)/.test(line) && !/^\s*([-*+]|\d+\.)\s/.test(line)) return line;
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
    .replace(/<(?!https?:\/\/)/g, '&lt;')
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

// The README's grouping of the skills you type; the rest go under "More".
const skillGroups = [
  { title: 'Route and configure', items: ['shipit', 'setup-shipit', 'shipit-help'] },
  { title: 'Understand', items: ['how', 'why', 'teach', 'recall', 'ketchup'] },
  { title: 'Design and review', items: ['architect', 'arena', 'swarm', 'interrogate', 'blast-radius'] },
  { title: 'Build and clean', items: ['tdd', 'benchmark-checklist', 'no-comments', 'unslop', 'technical-writing'] },
  {
    title: 'Improve the stack',
    items: ['reflect', 'correct', 'automate-me', 'show-me-your-work', 'figure-it-out', 'create-verification-skill', 'maintain-verification-skill'],
  },
].map((g) => ({ ...g, items: g.items.filter((s) => skills.includes(s)) }));
{
  const grouped = new Set(skillGroups.flatMap((g) => g.items));
  const rest = skills.filter((s) => !grouped.has(s));
  if (rest.length) skillGroups.push({ title: 'More', items: rest });
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

let count = 0;

// Playbooks.
{
  const dir = resetDir('playbooks');
  const info = new Map(playbookGroups.flatMap((g) => g.items.map((i) => [i.slug, i])));
  const titles = {};
  for (const slug of playbooks) {
    const src = `skills/shipit/playbooks/${slug}.md`;
    const { title, body } = takeTitle(read(join(repo, src)));
    titles[slug] = title ?? info.get(slug)?.name ?? slug;
    const description = info.get(slug)?.desc;
    writeFileSync(join(dir, `${slug}.md`), frontmatter({ title: titles[slug], description }) + convert(body, src));
    count++;
  }
  let index =
    'A playbook is the checklist `/shipit` follows for one kind of task. You never name it: you describe the task, and the router picks the playbook and copies its steps into the todo list. These pages are generated from `skills/shipit/playbooks/`.\n';
  for (const g of playbookGroups) {
    index += `\n## ${g.title}\n\n`;
    for (const i of g.items) index += `- **[${titles[i.slug]}](/playbooks/${i.slug}).** ${i.desc}\n`;
  }
  writeFileSync(join(dir, 'index.md'), frontmatter({ title: 'Playbooks', description: `The ${playbooks.length} playbooks /shipit routes tasks to.` }) + index);
  writeMeta(dir, 'Playbooks', playbookGroups);
}

// Principles.
{
  const dir = resetDir('principles');
  const info = new Map(principleGroups.flatMap((g) => g.items.map((i) => [i.slug, i])));
  const titles = {};
  for (const slug of principles) {
    const src = `skills/shipit/principles/${slug}.md`;
    const { title, body } = takeTitle(read(join(repo, src)));
    titles[slug] = title ?? info.get(slug)?.name ?? slug;
    let description = info.get(slug)?.desc;
    if (!description) {
      const applies = body.match(/\*\*Applies when:\*\*\s*(.+)/);
      description = applies ? plain(applies[1]) : undefined;
    }
    writeFileSync(join(dir, `${slug}.md`), frontmatter({ title: titles[slug], description }) + convert(body, src));
    count++;
  }
  let index =
    'Principles are one-rule files the router indexes. They are not skills, so they cost no context until one applies. `/shipit` names the principle that shaped each decision, and you can steer with the names ("apply prove it works"). These pages are generated from `skills/shipit/principles/`.\n';
  for (const g of principleGroups) {
    index += `\n## ${g.title}\n\n`;
    for (const i of g.items) index += `- **[${titles[i.slug]}](/principles/${i.slug}).** ${i.desc}\n`;
  }
  writeFileSync(join(dir, 'index.md'), frontmatter({ title: 'Principles', description: `The ${principles.length} principles /shipit applies and cites.` }) + index);
  writeMeta(dir, 'Principles', principleGroups);
}

// Skills.
{
  const dir = resetDir('skills');
  const descs = {};
  for (const name of skills) {
    const src = `skills/${name}/SKILL.md`;
    const { data, body: raw } = splitFrontmatter(read(join(repo, src)));
    const { body } = takeTitle(raw);
    descs[name] = data.description ?? '';
    writeFileSync(join(dir, `${name}.md`), frontmatter({ title: `/${name}`, description: data.description }) + convert(body, src));
    count++;
  }
  let index =
    'Every skill in the stack, one page each, generated from `skills/*/SKILL.md`. You can type any of them. Most set `disable-model-invocation`, so their descriptions stay out of your sessions\' context and `/shipit` reaches them by reading the file.\n';
  for (const g of skillGroups) {
    index += `\n## ${g.title}\n\n`;
    for (const name of g.items) index += `- **[/${name}](/skills/${name}).** ${convertText(plain(descs[name]), 'skills')}\n`;
  }
  writeFileSync(join(dir, 'index.md'), frontmatter({ title: 'Skills', description: `The ${skills.length} skills in the stack.` }) + index);
  writeMeta(
    dir,
    'Skills',
    skillGroups.map((g) => ({ title: g.title, items: g.items })),
  );
}

console.log(
  `sync-content: wrote ${count} pages (${playbooks.length} playbooks, ${skills.length} skills, ${principles.length} principles) to ${relative(site, out)}/`,
);
