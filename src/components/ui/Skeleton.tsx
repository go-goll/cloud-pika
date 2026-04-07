interface SkeletonProps {
  className?: string;
}

/** 骨架屏加载占位 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-pulse rounded-[var(--radius)]',
        'bg-[var(--surface-elevated)]',
        className ?? '',
      ].join(' ')}
    />
  );
}
