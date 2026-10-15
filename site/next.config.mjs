import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Everything the build needs lives in site/, so a deploy that uploads only
// this folder builds the same way.
const root = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: { root },
  outputFileTracingRoot: root,
  // The Benefits page was folded into the introduction.
  async redirects() {
    return [{ source: '/benefits', destination: '/', permanent: true }];
  },
};

export default withMDX(config);
