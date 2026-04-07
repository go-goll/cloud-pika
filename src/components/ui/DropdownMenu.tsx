import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

/** 下拉菜单根组件 */
const DropdownMenu = DropdownPrimitive.Root;

/** 下拉菜单触发器 */
const DropdownMenuTrigger = DropdownPrimitive.Trigger;

/** 下拉菜单内容面板 */
const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={[
        'z-50 min-w-[180px] overflow-hidden',
        'rounded-[var(--radius)] bg-[var(--surface-high)]',
        'p-1 shadow-ambient',
        'animate-[fadeIn_150ms_ease-out]',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

interface MenuItemProps
  extends ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> {
  /** 危险操作样式（红色文字） */
  danger?: boolean;
}

/** 下拉菜单选项 */
const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.Item>,
  MenuItemProps
>(({ className, danger, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={[
      'flex cursor-pointer select-none items-center',
      'rounded-[calc(var(--radius)-4px)] px-3 py-2 text-sm',
      'outline-none transition-colors',
      danger
        ? 'text-[var(--danger)] focus:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]'
        : 'text-[var(--text)] focus:bg-[var(--surface-elevated)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className ?? '',
    ].join(' ')}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

/** 下拉菜单分割线 */
const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator
    ref={ref}
    className={[
      'mx-1 my-1 h-px bg-[var(--outline)]',
      className ?? '',
    ].join(' ')}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
