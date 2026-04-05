import type { InputHTMLAttributes } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'h-10 w-full rounded-[var(--radius)] border border-transparent',
        'bg-[var(--surface-low)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
        'focus:border-[color-mix(in_srgb,var(--primary)_40%,transparent)] focus:outline-none',
        'focus:shadow-[0_0_0_3px_var(--primary-glow)]',
        props.className ?? '',
      ].join(' ')}
    />
  );
}
