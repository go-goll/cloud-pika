import type { CSSProperties, PropsWithChildren } from 'react';

interface CardProps {
  className?: string;
  style?: CSSProperties;
}

export function Card({
  className,
  style,
  children,
}: PropsWithChildren<CardProps>) {
  return (
    <section
      className={[
        'rounded-[calc(var(--radius)+2px)]',
        'bg-[var(--surface-high)] p-4 shadow-ambient',
        'no-line',
        className ?? '',
      ].join(' ')}
      style={style}
    >
      {children}
    </section>
  );
}
