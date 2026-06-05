import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef, type ElementRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  /** 当前选中值 */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 选项列表 */
  options: SelectOption[];
  /** 标签（用作 placeholder） */
  label?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 下拉选择组件
 * 基于 Radix UI Select 封装，保持与原有接口一致
 */
export function Select({
  value,
  onChange,
  options,
  label,
  className,
  disabled,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={className} label={label} />
      <SelectPrimitive.Portal>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/** 触发器按钮，样式与 Input 组件保持一致 */
const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  { className?: string; label?: string }
>(({ className, label }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={[
      'inline-flex h-10 w-full items-center justify-between',
      'rounded-xl border border-[var(--border)]',
      'bg-[var(--bg)] px-3 text-sm text-[var(--text)]',
      'placeholder:text-[var(--text-secondary)]',
      'hover:border-[var(--accent)]/30',
      'focus:border-[var(--accent)]',
      'focus:shadow-[0_0_0_3px_var(--accent-soft)]',
      'focus:outline-none transition-all',
      'disabled:cursor-not-allowed disabled:opacity-60',
      className ?? '',
    ].join(' ')}
  >
    <SelectPrimitive.Value placeholder={label} />
    <SelectPrimitive.Icon>
      <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

/** 下拉内容面板 */
const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  SelectPrimitive.SelectContentProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Content
    ref={ref}
    position="popper"
    sideOffset={4}
    className={[
      'z-50 max-h-60 min-w-[var(--radix-select-trigger-width)]',
      'overflow-hidden rounded-xl',
      'bg-[var(--bg-card)] p-1 border border-[var(--border)] shadow-lg',
      'animate-[fadeIn_150ms_ease-out]',
      className ?? '',
    ].join(' ')}
    {...props}
  >
    <SelectPrimitive.Viewport>
      {children}
    </SelectPrimitive.Viewport>
  </SelectPrimitive.Content>
));
SelectContent.displayName = 'SelectContent';

/** 单个选项 */
const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  SelectPrimitive.SelectItemProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={[
      'flex cursor-pointer select-none items-center',
      'rounded-lg px-3 py-2 text-sm',
      'text-[var(--text)] outline-none',
      'data-[highlighted]:bg-[rgba(234,239,242,0.4)] dark:data-[highlighted]:bg-[rgba(255,255,255,0.06)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className ?? '',
    ].join(' ')}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="ml-auto">
      <Check className="h-4 w-4 text-[var(--accent)]" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';
