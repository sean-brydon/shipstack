import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type CalloutType = 'info' | 'warn' | 'warning' | 'error' | 'success' | 'idea' | 'tip';

const icons = {
  info: Info,
  warning: CircleAlert,
  error: CircleX,
  success: CircleCheck,
} as const;

export function Callout({ type = 'info', title, children }: { type?: CalloutType; title?: ReactNode; children?: ReactNode }) {
  const kind = type === 'warn' || type === 'warning' ? 'warning' : type === 'error' || type === 'success' ? type : 'info';
  const Icon = icons[kind];
  return (
    <div className="ss-callout not-prose" data-type={kind} role={kind === 'warning' || kind === 'error' ? 'note' : undefined}>
      <Icon className="ss-callout-icon" aria-hidden="true" />
      <div className="ss-callout-body">
        {title && <p className="ss-callout-title">{title}</p>}
        <div className="ss-callout-text">{children}</div>
      </div>
    </div>
  );
}
