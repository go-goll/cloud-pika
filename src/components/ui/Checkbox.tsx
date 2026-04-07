import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { forwardRef, type ElementRef } from 'react';

interface CheckboxProps {
  /** 标签文本 */
  label?: string;
  /** 是否选中 */
  checked?: boolean;
  /** 选中状态变化回调 */
  onCheckedChange?: (checked: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 复选框组件
 * 基于 Radix UI Checkbox 封装，支持深色/浅色主题
 */
export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ label, checked, onCheckedChange, disabled, className }, ref) => (
  <label
    className={[
      'inline-flex items-center gap-2 text-sm',
      'text-[var(--text)]',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      className ?? '',
    ].join(' ')}
  >
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={[
        'flex h-[18px] w-[18px] shrink-0 items-center',
        'justify-center rounded-[4px] border transition-colors',
        'border-[var(--outline)] bg-[var(--surface-low)]',
        'data-[state=checked]:border-transparent',
        'data-[state=checked]:bg-[var(--primary)]',
        'focus-visible:outline-none',
        'focus-visible:shadow-[0_0_0_3px_var(--primary-glow)]',
        'disabled:cursor-not-allowed disabled:opacity-60',
      ].join(' ')}
    >
      <CheckboxPrimitive.Indicator>
        <Check
          className="h-3.5 w-3.5 text-[var(--on-primary)]"
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {label && <span>{label}</span>}
  </label>
));
Checkbox.displayName = 'Checkbox';
