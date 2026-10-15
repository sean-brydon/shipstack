import type { ReactNode } from 'react';

// Blocks that show only in one mode of the switch (components/mode-switch.tsx).
// Both render on the server; CSS keyed on <html data-mode> hides one. With JS
// off both show, each under its label.
function Only({ mode, label, children }: { mode: 'berth' | 'noberth'; label: string; children: ReactNode }) {
  return (
    <div className="ss-only" data-only={mode}>
      <p className="ss-only-label">{label}</p>
      {children}
    </div>
  );
}

export function Berth({ children }: { children: ReactNode }) {
  return (
    <Only mode="berth" label="With berth">
      {children}
    </Only>
  );
}

export function NoBerth({ children }: { children: ReactNode }) {
  return (
    <Only mode="noberth" label="Without berth">
      {children}
    </Only>
  );
}
