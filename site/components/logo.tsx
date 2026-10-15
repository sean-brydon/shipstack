// The mark: three stacked layers, the top one lit. A stack of skills that
// ships.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="3" y="15" width="18" height="5" rx="1.6" fill="currentColor" opacity="0.38" />
      <rect x="4.5" y="9.5" width="15" height="4.5" rx="1.5" fill="currentColor" opacity="0.66" />
      <rect x="6" y="4" width="12" height="4.5" rx="1.4" fill="var(--ss-accent)" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="ss-brand">
      <Mark className="ss-brand-mark" />
      <span className="ss-brand-word">shipstack</span>
      <span className="ss-brand-docs">docs</span>
    </span>
  );
}
