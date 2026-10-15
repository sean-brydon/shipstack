export const appName = 'shipstack';

// Vercel sets the production host; locally the site runs on its own.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const siteUrl = host ? `https://${host}` : 'http://localhost:1431';

export const githubUrl = 'https://github.com/sean-brydon/shipstack';
const blob = `${githubUrl}/blob/main`;

// Where a page's text comes from: generated pages point at the repo file
// they were made from, hand-written ones at their MDX.
export function editUrl(path: string) {
  let m = path.match(/^playbooks\/(?!index\.)(.+)\.md$/);
  if (m) return `${blob}/skills/shipit/playbooks/${m[1]}.md`;
  m = path.match(/^principles\/(?!index\.)(.+)\.md$/);
  if (m) return `${blob}/skills/shipit/principles/${m[1]}.md`;
  m = path.match(/^skills\/(?!index\.)(.+)\.md$/);
  if (m) return `${blob}/skills/${m[1]}/SKILL.md`;
  if (/^(playbooks|principles|skills)\/index\.md$/.test(path)) return `${blob}/site/scripts/sync-content.mjs`;
  return `${blob}/site/content/docs/${path}`;
}
