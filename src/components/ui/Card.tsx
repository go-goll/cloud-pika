import type { PropsWithChildren } from 'react';

interface CardProps {
  className?: string;
}

export function Card({ className, children }: PropsWithChildren<CardProps>) {
  return (
    <section
      className={[
        'rounded-[calc(var(--radius)+2px)] bg-[var(--surface-high)] p-4 shadow-ambient',
        'no-line',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </section>
  );
}
