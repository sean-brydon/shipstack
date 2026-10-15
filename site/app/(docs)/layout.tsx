import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { SiteHeader } from '@/components/site-header';
import { ModeSwitch } from '@/components/mode-switch';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteHeader />
      <DocsLayout tree={source.getPageTree()} {...baseOptions()} sidebar={{ banner: <ModeSwitch /> }}>
        {children}
      </DocsLayout>
    </>
  );
}
