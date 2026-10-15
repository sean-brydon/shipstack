import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { Callout } from './callout';
import { EvalBars } from './eval-bars';
import { Berth, NoBerth } from './mode';
import { Run } from './run';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Berth,
    Callout,
    EvalBars,
    NoBerth,
    Run,
    Step,
    Steps,
    Tab,
    Tabs,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
