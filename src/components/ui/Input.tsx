import { Eye, EyeOff, X } from 'lucide-react';
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  /** 左侧图标（如搜索图标） */
  icon?: ReactNode;
  /** 是否显示清除按钮 */
  clearable?: boolean;
  /** 清除时的回调 */
  onClear?: () => void;
}

/** 输入框基础样式 */
const baseClasses = [
  'h-10 w-full rounded-lg',
  'bg-[var(--color-surface-container-low)]',
  'text-sm text-[var(--color-on-surface)]',
  'ghost-border',
  'placeholder:text-[var(--color-on-surface-variant)]/60',
  'focus:ring-2 focus:ring-[var(--accent)]/20',
  'focus:border-[var(--accent)]/40',
  'focus:bg-[var(--color-surface-container-lowest)]',
  'focus:shadow-[var(--shadow-sm)]',
  'focus:outline-none transition-all duration-200',
].join(' ');

/**
 * 增强输入框组件
 * 支持左侧图标、密码显隐切换、可清除内容
 */
export const Input = forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      icon,
      clearable,
      onClear,
      className,
      type,
      value,
      ...rest
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const hasValue = value !== undefined && value !== '';

    /** 是否需要右侧操作按钮 */
    const hasRightAction =
      isPassword || (clearable && hasValue);
    /** 是否有左侧图标 */
    const hasLeftIcon = !!icon;

    return (
      <div className="relative w-full">
        {/* 左侧图标 */}
        {hasLeftIcon && (
          <div
            className={[
              'pointer-events-none absolute left-3',
              'top-1/2 -translate-y-1/2',
              'text-[var(--color-on-surface-variant)]',
            ].join(' ')}
          >
            {icon}
          </div>
        )}

        <input
          ref={ref}
          type={
            isPassword && showPassword ? 'text' : type
          }
          value={value}
          className={[
            baseClasses,
            hasLeftIcon ? 'pl-10' : 'px-3',
            hasRightAction ? 'pr-10' : 'px-3',
            className ?? '',
          ].join(' ')}
          {...rest}
        />

        {/* 右侧操作区域 */}
        {hasRightAction && (
          <div
            className={[
              'absolute right-1 top-1/2',
              '-translate-y-1/2 flex items-center',
            ].join(' ')}
          >
            {/* 清除按钮 */}
            {clearable && hasValue && !isPassword && (
              <button
                type="button"
                onClick={onClear}
                tabIndex={-1}
                className={[
                  'flex h-8 w-8 items-center',
                  'justify-center rounded-md',
                  'text-[var(--color-on-surface-variant)]',
                  'hover:text-[var(--color-on-surface)]',
                  'transition-colors',
                ].join(' ')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {/* 密码显隐切换 */}
            {isPassword && (
              <button
                type="button"
                onClick={() =>
                  setShowPassword((v) => !v)
                }
                tabIndex={-1}
                className={[
                  'flex h-8 w-8 items-center',
                  'justify-center rounded-md',
                  'text-[var(--color-on-surface-variant)]',
                  'hover:text-[var(--color-on-surface)]',
                  'transition-colors',
                ].join(' ')}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
