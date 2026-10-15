// The 2026-10 reading-roles eval (docs/evals/2026-10-explorer-models.md in
// the repo), drawn as plain bars. The numbers are copied from that file's
// results table; explorer-scores.csv and explorer-cost.csv hold the raw runs.
const arms = [
  { arm: 'Haiku, high', score: 19.3, cost: 0.017, secs: 99, wrong: '3 / 39' },
  { arm: 'Haiku, xhigh', score: 23.3, cost: 0.04, secs: 275, wrong: '5 / 50', pick: true },
  { arm: 'Sonnet, xhigh', score: 21.0, cost: 0.665, secs: 166, wrong: '2 / 46' },
];

type Metric = { title: string; unit: string; max: number; value: (a: (typeof arms)[number]) => number; format: (n: number) => string; note: string };

const metrics: Metric[] = [
  { title: 'Mean score', unit: 'out of 25, higher is better', max: 25, value: (a) => a.score, format: (n) => n.toFixed(1), note: 'Blind judge (Opus 5.5), 5 axes scored 1 to 5.' },
  { title: 'Mean cost per run', unit: 'US dollars, lower is better', max: 0.7, value: (a) => a.cost, format: (n) => `$${n.toFixed(3)}`, note: 'Recorded token usage at list prices.' },
  { title: 'Mean time per run', unit: 'seconds, lower is better', max: 300, value: (a) => a.secs, format: (n) => `${n} s`, note: 'Wall clock per explorer run.' },
];

export function EvalBars() {
  return (
    <figure className="ss-bars not-prose">
      <div className="ss-bars-grid">
        {metrics.map((m) => (
          <div key={m.title} className="ss-bars-panel">
            <p className="ss-bars-title">{m.title}</p>
            <p className="ss-bars-unit">{m.unit}</p>
            <ul>
              {arms.map((a) => {
                const v = m.value(a);
                return (
                  <li key={a.arm} data-pick={a.pick || undefined}>
                    <span className="ss-bars-label">{a.arm}</span>
                    <span className="ss-bars-track" aria-hidden="true">
                      <span className="ss-bars-fill" style={{ width: `${Math.max(1.5, (v / m.max) * 100)}%` }} />
                    </span>
                    <span className="ss-bars-value">{m.format(v)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="ss-bars-note">{m.note}</p>
          </div>
        ))}
      </div>
      <figcaption>
        Three <code>/how</code> questions on one Go codebase, one run per arm per question (9 runs). Source:{' '}
        <a href="https://github.com/sean-brydon/shipstack/blob/main/docs/evals/2026-10-explorer-models.md">docs/evals/2026-10-explorer-models.md</a>.
      </figcaption>
    </figure>
  );
}
