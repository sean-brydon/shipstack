import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { modeScript } from '@/lib/mode';
import { siteUrl } from '@/lib/shared';
import './global.css';

const inter = localFont({
  src: '../assets/fonts/inter-latin-wght.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
});

const mono = localFont({
  src: '../assets/fonts/jetbrains-mono-latin-wght.woff2',
  weight: '100 800',
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'shipstack docs', template: '%s · shipstack' },
  description: 'shipstack is a skill stack for Claude Code. Type /shipit with a task: it picks a playbook, runs the steps, and shows you the proof.',
  openGraph: { siteName: 'shipstack docs', type: 'website' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#17181b' },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* The berth switch's choice, on <html> before first paint (lib/mode.ts). */}
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider theme={{ defaultTheme: 'system', enableSystem: true }}>{children}</RootProvider>
      </body>
    </html>
  );
}
