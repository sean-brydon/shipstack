import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Logo } from '@/components/logo';
import { DrawerLinks } from '@/components/site-header';

// On a laptop-sized screen the site header carries the lockup and GitHub;
// on a phone the docs' header has the lockup and the drawer has GitHub.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
      url: '/',
    },
    themeSwitch: { mode: 'light-dark-system' },
    links: [{ type: 'custom', children: <DrawerLinks /> }],
  };
}
