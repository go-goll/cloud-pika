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
        'rounded-lg p-4',
        'bg-[var(--bg-raised)]',
        'border border-[var(--border)]',
        'shadow-[var(--shadow-xs)]',
        hoverable
          ? [
              'transition-all duration-200',
              'hover:-translate-y-[2px]',
              'hover:shadow-[var(--shadow-md)]',
              'hover:border-[var(--accent)]/20',
            ].join(' ')
          : '',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </section>
  );
}
