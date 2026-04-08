import type { PropsWithChildren } from 'react';

interface CardProps {
  /** 自定义类名 */
  className?: string;
  /** 是否启用 hover 微提升效果 */
  hoverable?: boolean;
}

/** 卡片容器：ghost-border + ambient-shadow + 圆角 12px */
export function Card({
  className,
  hoverable = false,
  children,
}: PropsWithChildren<CardProps>) {
  return (
    <section
      className={[
        'rounded-xl p-4',
        'bg-[var(--color-surface-container-lowest)]',
        'ghost-border ambient-shadow',
        hoverable
          ? 'transition-transform duration-200 hover:-translate-y-0.5'
          : '',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </section>
  );
}
