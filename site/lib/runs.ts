import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// A recorded `claude -p` session, as content/runs/<id>.json holds it.
export type RunStep =
  | { kind: 'text'; agent: string; text: string }
  | {
      kind: 'tool';
      agent: string;
      name: string;
      summary?: string;
      input?: string;
      output?: string;
      is_error?: boolean;
    };

export type RunAgent = { label: string; model?: string };

export type RunRecord = {
  id: string;
  title: string;
  command?: string;
  playbook?: string;
  environment?: string;
  repo?: string;
  prompt?: string;
  model?: string;
  recorded?: string;
  duration_s?: number;
  cost_usd?: number;
  turns?: number;
  agents?: RunAgent[];
  steps?: RunStep[];
  result?: string;
  diff?: string | null;
  notes?: string[];
  fixture?: boolean;
};

const runsDir = join(process.cwd(), 'content', 'runs');
const ID = /^[a-z0-9_-]+$/i;

export async function loadRun(id: string): Promise<RunRecord | null> {
  if (!ID.test(id)) return null;
  try {
    const data = JSON.parse(await readFile(join(runsDir, `${id}.json`), 'utf8')) as RunRecord;
    if (!data || typeof data !== 'object' || typeof data.title !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

export async function listRunIds(): Promise<string[]> {
  try {
    return (await readdir(runsDir)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  } catch {
    return [];
  }
}
