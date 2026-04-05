import type { PropsWithChildren } from 'react';

export function Badge({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] px-2.5 py-1 text-xs text-[var(--text)]">
      {children}
    </span>
  );
}
