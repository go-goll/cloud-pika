import type { SelectHTMLAttributes } from 'react';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'h-10 w-full rounded-[var(--radius)] border border-transparent',
        'bg-[var(--surface-low)] px-3 text-sm text-[var(--text)] focus:outline-none',
        'focus:border-[color-mix(in_srgb,var(--primary)_40%,transparent)]',
        props.className ?? '',
      ].join(' ')}
    />
  );
}
