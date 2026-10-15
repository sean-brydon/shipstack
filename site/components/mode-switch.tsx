'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_MODE, MODE_EVENT, MODE_KEY, type Mode } from '@/lib/mode';

const options: { value: Mode; label: string }[] = [
  { value: 'noberth', label: 'Without berth' },
  { value: 'berth', label: 'With berth' },
];

function current(): Mode {
  return document.documentElement.getAttribute('data-mode') === 'berth' ? 'berth' : DEFAULT_MODE;
}

function apply(mode: Mode) {
  document.documentElement.setAttribute('data-mode', mode);
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  window.dispatchEvent(new CustomEvent(MODE_EVENT, { detail: mode }));
}

// The highlight comes from CSS on <html data-mode>, so the server render is
// already right on first paint; state only drives aria-pressed.
export function ModeSwitch() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    setMode(current());
    const sync = () => setMode(current());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== MODE_KEY) return;
      document.documentElement.setAttribute('data-mode', e.newValue === 'berth' ? 'berth' : DEFAULT_MODE);
      sync();
    };
    window.addEventListener(MODE_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(MODE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <div className="ss-switch">
      <p className="ss-switch-label" id="ss-switch-label">
        Examples
      </p>
      <div className="ss-switch-track" role="group" aria-labelledby="ss-switch-label">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            data-value={o.value}
            aria-pressed={mode === null ? undefined : mode === o.value}
            onClick={() => apply(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="ss-switch-hint">
        berth is <a href="/berth">Shipyard</a>. Pick how you run Claude Code.
      </p>
    </div>
  );
}
