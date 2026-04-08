import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
} from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮风格 */
  variant?: Variant;
  /** 按钮尺寸 */
  size?: Size;
  /** 加载状态：显示 Spinner 并禁用交互 */
  loading?: boolean;
  /** 仅图标模式（正方形按钮） */
  iconOnly?: boolean;
}

/** 风格样式映射 */
const variantClasses: Record<Variant, string> = {
  primary: [
    'signature-gradient text-white',
    'ambient-shadow',
    'hover:brightness-110',
  ].join(' '),
  secondary: [
    'ghost-border',
    'bg-[var(--color-surface-container-lowest)]',
    'text-[var(--color-on-surface)]',
    'hover:bg-[var(--color-surface-container-low)]',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'text-[var(--color-on-surface-variant)]',
    'hover:bg-[var(--color-surface-container-low)]',
    'hover:text-[var(--color-on-surface)]',
  ].join(' '),
  danger: [
    'bg-[var(--color-danger)] text-white',
    'hover:brightness-110',
  ].join(' '),
};

/** 尺寸样式映射 */
const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
};

/** 仅图标模式的尺寸映射（正方形） */
const iconOnlySizeClasses: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

/** Spinner 尺寸映射 */
const spinnerSize: Record<Size, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  type = 'button',
  disabled,
  ...rest
}: PropsWithChildren<ButtonProps>) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center',
        'rounded-lg font-medium',
        'transition-all duration-200',
        'active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'disabled:hover:scale-100',
        'disabled:hover:brightness-100',
        variantClasses[variant],
        iconOnly
          ? iconOnlySizeClasses[size]
          : sizeClasses[size],
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Spinner size={spinnerSize[size]} />
      ) : (
        children
      )}
    </button>
  );
}
