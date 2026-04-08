import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';

/** Tooltip 根容器（提供 Provider） */
const TooltipProvider = TooltipPrimitive.Provider;

/** Tooltip 根组件 */
const Tooltip = TooltipPrimitive.Root;

/** Tooltip 触发器 */
const TooltipTrigger = TooltipPrimitive.Trigger;

/** Tooltip 内容气泡 */
const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={[
      'z-50 rounded-lg px-3 py-1.5',
      'bg-surface-container-lowest ghost-border',
      'text-sm text-on-surface shadow-ambient',
      'animate-[fadeIn_150ms_ease-out]',
      className ?? '',
    ].join(' ')}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

/** 简易 Tooltip 包装：传入 content 即可使用 */
interface SimpleTooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function SimpleTooltip({
  content,
  children,
  side = 'top',
}: SimpleTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
};
