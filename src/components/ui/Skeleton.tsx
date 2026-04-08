import type { HTMLAttributes } from 'react';

/** 基础骨架屏组件，通过 className 控制宽高 */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'animate-pulse rounded-xl',
        'bg-surface-container-low',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  );
}

/** 单行文字骨架 */
export function SkeletonLine({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={['h-4 w-full', className ?? ''].join(' ')}
      {...props}
    />
  );
}

/** 块状区域骨架 */
export function SkeletonBlock({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={['h-24 w-full', className ?? ''].join(' ')}
      {...props}
    />
  );
}
