import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="ss-not-found [grid-area:main]">
      <p className="ss-not-found-code">404</p>
      <h1>Nothing shipped here.</h1>
      <p>The page may have moved. Try one of these.</p>
      <div className="ss-not-found-links">
        <Link href="/">Introduction</Link>
        <Link href="/getting-started">Getting started</Link>
        <Link href="/playbooks">Playbooks</Link>
      </div>
    </main>
  );
}
