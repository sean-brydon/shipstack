import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Run } from '@/components/run';
import { listRunIds, loadRun } from '@/lib/runs';

// A bare page per recording, for checking a run file (including the
// _fixture one) before a docs page uses it. Not linked from the docs and not
// indexed.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listRunIds()).map((id) => ({ id }));
}

export const metadata: Metadata = { title: 'Run preview', robots: { index: false, follow: false } };

export default async function RunPreview(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  if (!(await loadRun(id))) notFound();
  return (
    <main className="ss-preview">
      <p className="ss-eyebrow">Run preview: {id}</p>
      <Run id={id} />
    </main>
  );
}
