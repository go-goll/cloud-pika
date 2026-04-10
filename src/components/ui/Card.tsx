import type { PropsWithChildren } from 'react';

interface CardProps {
  className?: string;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

/** 卡片容器：精致边框 + 微妙内阴影 + 圆角 */
export function Card({
  className,
  hoverable = false,
  style,
  children,
}: PropsWithChildren<CardProps>) {
  return (
    <section
      style={style}
      className={[
        'rounded-2xl p-4',
        'bg-[var(--bg-card)]',
        'border border-[var(--border)]',
        'shadow-sm',
        hoverable
          ? 'bento-card transition-all duration-250'
          : '',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </section>
  );
}
