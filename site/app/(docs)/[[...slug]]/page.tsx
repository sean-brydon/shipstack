import { source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle, EditOnGitHub } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/components/mdx';
import { editUrl, githubUrl } from '@/lib/shared';
import { sectionTitle } from '@/lib/sections';

const generated = new Set(['playbooks', 'skills', 'principles']);

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const home = page.slugs.length === 0;
  const eyebrow = home ? 'Documentation' : sectionTitle(page.slugs);
  const fromRepo = generated.has(page.slugs[0]) && page.slugs.length > 1;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} footer={{ children: <PageFoot /> }}>
      <header className="ss-page-head" data-home={home || undefined} data-section={page.slugs[0]}>
        {eyebrow && <p className="ss-eyebrow">{eyebrow}</p>}
        <DocsTitle>{home ? 'shipstack' : page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
      </header>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      <div className="ss-edit-row">
        <EditOnGitHub href={editUrl(page.path)} className="ss-edit">
          {fromRepo ? 'View the source file on GitHub' : 'Edit this page on GitHub'}
        </EditOnGitHub>
      </div>
    </DocsPage>
  );
}

function PageFoot() {
  return (
    <footer className="ss-foot">
      <span>shipstack is MIT licensed, adapted from pstack by Lauren Tan.</span>
      <nav aria-label="Elsewhere">
        <a href={githubUrl}>GitHub</a>
        <a href={`${githubUrl}/issues`}>Report an issue</a>
      </nav>
    </footer>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return {
    title: page.slugs.length === 0 ? { absolute: 'shipstack docs' } : page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: { title: page.data.title, description: page.data.description, url: page.url },
  };
}
