/** 尺寸配置映射 */
const sizeMap = {
  sm: 'h-4 w-4 border-[2px]',
  md: 'h-6 w-6 border-[2.5px]',
  lg: 'h-8 w-8 border-[3px]',
} as const;

interface SpinnerProps {
  /** 尺寸：sm(16px) | md(24px) | lg(32px) */
  size?: keyof typeof sizeMap;
  /** 自定义类名 */
  className?: string;
}

/** 加载旋转动画组件 */
export function Spinner({
  size = 'md',
  className,
}: SpinnerProps) {
  return (
    <div
      className={[
        'inline-block animate-spin rounded-full',
        'border-primary border-t-transparent',
        sizeMap[size],
        className ?? '',
      ].join(' ')}
      role="status"
      aria-label="loading"
    />
  );
}
