import { Markdown } from 'fumadocs-core/content/md';
import { remarkGfm } from 'fumadocs-core/mdx-plugins/remark-gfm';
import { Bot, ChevronRight, CircleAlert, FileDiff, Terminal, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { loadRun, type RunRecord, type RunStep } from '@/lib/runs';

// A recorded agent session (content/runs/<id>.json): the header, the prompt,
// the steps with each subagent's run grouped under its label, the final
// reply and the diff. Everything is server-rendered; tool steps open with
// <details>, so it reads fine with JS off.

const md = (text: string) => <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>;

function duration(s?: number) {
  if (s === undefined || !Number.isFinite(s)) return undefined;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m}m ${r}s` : `${r}s`;
}

function date(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function Missing({ id }: { id: string }) {
  return (
    <div className="ss-run ss-run-missing not-prose" role="note">
      <Terminal aria-hidden="true" />
      <div>
        <p className="ss-run-missing-title">Recording not available yet</p>
        <p>
          This page will show a real session once <code>content/runs/{id}.json</code> exists.
        </p>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  if (children === undefined || children === null || children === '') return null;
  return (
    <div className="ss-run-meta-item">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Header({ run }: { run: RunRecord }) {
  return (
    <header className="ss-run-head">
      <div className="ss-run-badges">
        {run.command && <span className="ss-run-badge" data-kind="command">{run.command}</span>}
        {run.playbook && <span className="ss-run-badge">{run.playbook}</span>}
      </div>
      <p className="ss-run-title">{run.title}</p>
      <dl className="ss-run-meta">
        <Meta label="Model">{run.model}</Meta>
        <Meta label="Duration">{duration(run.duration_s)}</Meta>
        <Meta label="Cost">{run.cost_usd !== undefined ? `$${run.cost_usd.toFixed(2)}` : undefined}</Meta>
        <Meta label="Turns">{run.turns}</Meta>
        <Meta label="Recorded">{date(run.recorded)}</Meta>
      </dl>
      {(run.environment || run.repo) && (
        <dl className="ss-run-env">
          <Meta label="Environment">{run.environment}</Meta>
          <Meta label="Repo">{run.repo}</Meta>
        </dl>
      )}
    </header>
  );
}

function ToolStep({ step }: { step: Extract<RunStep, { kind: 'tool' }> }) {
  return (
    <details className="ss-run-tool" data-error={step.is_error || undefined}>
      <summary>
        <ChevronRight className="ss-run-chevron" aria-hidden="true" />
        <span className="ss-run-tool-name">{step.name}</span>
        {step.summary && <span className="ss-run-tool-summary">{step.summary}</span>}
        {step.is_error && (
          <span className="ss-run-tool-error">
            <CircleAlert aria-hidden="true" />
            error
          </span>
        )}
      </summary>
      <div className="ss-run-tool-body">
        {step.input ? (
          <div>
            <p className="ss-run-io-label">Input</p>
            <pre className="ss-run-io">{step.input}</pre>
          </div>
        ) : null}
        {step.output ? (
          <div>
            <p className="ss-run-io-label">Output</p>
            <pre className="ss-run-io">{step.output}</pre>
          </div>
        ) : null}
        {!step.input && !step.output && <p className="ss-run-io-label">No input or output recorded.</p>}
      </div>
    </details>
  );
}

function Step({ step }: { step: RunStep }) {
  if (step.kind === 'tool') return <ToolStep step={step} />;
  return <div className="ss-run-text">{md(step.text)}</div>;
}

// Consecutive main-agent steps become one group. Each subagent's steps all
// go in one group where it first appears, so reviewers running in parallel
// read as three blocks, not dozens of interleaved one-step slivers.
type Group = { agent: string; steps: RunStep[] };

function groups(steps: RunStep[], main: string) {
  const out: Group[] = [];
  const bySub = new Map<string, Group>();
  for (const s of steps) {
    const agent = s.agent || main;
    const last = out.at(-1);
    const g = agent === main ? (last?.agent === main ? last : undefined) : bySub.get(agent);
    if (g) g.steps.push(s);
    else {
      out.push({ agent, steps: [s] });
      if (agent !== main) bySub.set(agent, out.at(-1)!);
    }
  }
  return out;
}

function Diff({ diff }: { diff: string }) {
  const lines = diff.replace(/\n$/, '').split('\n');
  const files = lines.filter((l) => l.startsWith('+++ ')).length;
  const added = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
  const removed = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;
  const kind = (l: string) =>
    l.startsWith('+++') || l.startsWith('---') || l.startsWith('diff ') || l.startsWith('index ')
      ? 'file'
      : l.startsWith('@@')
        ? 'hunk'
        : l.startsWith('+')
          ? 'add'
          : l.startsWith('-')
            ? 'del'
            : undefined;
  return (
    <details className="ss-run-diff">
      <summary>
        <ChevronRight className="ss-run-chevron" aria-hidden="true" />
        <FileDiff className="ss-run-diff-icon" aria-hidden="true" />
        <span>The diff</span>
        <span className="ss-run-diff-stat">
          {files ? `${files} ${files === 1 ? 'file' : 'files'} ` : ''}
          <span data-kind="add">+{added}</span> <span data-kind="del">-{removed}</span>
        </span>
      </summary>
      <pre className="ss-run-diff-code">
        <code>
          {lines.map((l, i) => (
            <span key={i} className="ss-run-diff-line" data-kind={kind(l)}>
              {l || ' '}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </details>
  );
}

export async function Run({ id }: { id: string }) {
  const run = await loadRun(id);
  if (!run) return <Missing id={id} />;

  const models = new Map((run.agents ?? []).map((a) => [a.label, a.model]));
  const main = run.agents?.[0]?.label ?? 'main';

  return (
    <section className="ss-run not-prose" aria-label={`Recorded run: ${run.title}`}>
      <Header run={run} />

      {run.prompt && (
        <div className="ss-run-prompt">
          <div className="ss-run-bubble">
            <p className="ss-run-who">
              <User aria-hidden="true" />
              You
            </p>
            <p className="ss-run-prompt-text">{run.prompt}</p>
          </div>
        </div>
      )}

      <ol className="ss-run-steps">
        {groups(run.steps ?? [], main).map((g, i) =>
          g.agent === main ? (
            <li key={i} className="ss-run-group" data-main="">
              {g.steps.map((s, j) => (
                <Step key={j} step={s} />
              ))}
            </li>
          ) : (
            <li key={i} className="ss-run-group" data-sub="">
              <details open={g.steps.length <= 8} className="ss-run-sub">
                <summary>
                  <ChevronRight className="ss-run-chevron" aria-hidden="true" />
                  <Bot className="ss-run-sub-icon" aria-hidden="true" />
                  <span className="ss-run-sub-label">{g.agent}</span>
                  {models.get(g.agent) && <span className="ss-run-sub-model">{models.get(g.agent)}</span>}
                  <span className="ss-run-sub-count">
                    {g.steps.length} {g.steps.length === 1 ? 'step' : 'steps'}
                  </span>
                </summary>
                <div className="ss-run-sub-body">
                  {g.steps.map((s, j) => (
                    <Step key={j} step={s} />
                  ))}
                </div>
              </details>
            </li>
          ),
        )}
      </ol>

      {run.result && (
        <div className="ss-run-result">
          <p className="ss-run-who">
            <Bot aria-hidden="true" />
            Final reply
          </p>
          <div className="ss-run-md">{md(run.result)}</div>
        </div>
      )}

      {run.diff ? <Diff diff={run.diff} /> : null}

      {run.notes && run.notes.length > 0 && (
        <ul className="ss-run-notes">
          {run.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}

      <p className="ss-run-foot">
        Recorded from a real <code>claude -p</code> session. Costs at list API prices.
      </p>
    </section>
  );
}

// The runs index: one row per recording, its numbers read from the run file.
export async function RunTable({ runs }: { runs: { id: string; href: string; label: string; asked: string }[] }) {
  const rows = await Promise.all(runs.map(async (r) => ({ ...r, run: await loadRun(r.id) })));
  return (
    <table>
      <thead>
        <tr>
          <th>run</th>
          <th>what was asked</th>
          <th>playbook</th>
          <th>time</th>
          <th>cost</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ id, href, label, asked, run }) => (
          <tr key={id}>
            <td>
              <a href={href}>{label}</a>
            </td>
            <td>{asked}</td>
            <td>{run?.playbook ?? (run?.command ? <code>{run.command}</code> : null)}</td>
            <td>{duration(run?.duration_s)}</td>
            <td>{run?.cost_usd !== undefined ? `$${run.cost_usd.toFixed(2)}` : null}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
