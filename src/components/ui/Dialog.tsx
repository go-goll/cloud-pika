import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';

/** 对话框根组件 */
const Dialog = DialogPrimitive.Root;

/** 对话框触发器 */
const DialogTrigger = DialogPrimitive.Trigger;

/** 对话框关闭按钮 */
const DialogClose = DialogPrimitive.Close;

/** 对话框遮罩层 */
const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={[
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
      'data-[state=open]:animate-[fadeIn_150ms_ease-out]',
      'data-[state=closed]:animate-[fadeOut_100ms_ease-in]',
      className ?? '',
    ].join(' ')}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

/** 对话框内容区 */
const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={[
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg',
        '-translate-x-1/2 -translate-y-1/2',
        'rounded-xl bg-surface-container-lowest',
        'p-6 ghost-border shadow-ambient',
        'data-[state=open]:animate-[dialogIn_200ms_ease-out]',
        'data-[state=closed]:animate-[dialogOut_150ms_ease-in]',
        className ?? '',
      ].join(' ')}
      {...props}
    >
      {children}
      {/* 右上角关闭按钮 */}
      <DialogPrimitive.Close
        className={[
          'absolute right-4 top-4 rounded-lg',
          'p-1 text-on-surface-variant',
          'hover:bg-surface-container-low',
          'hover:text-on-surface',
          'transition-colors',
        ].join(' ')}
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

/** 对话框标题区域容器 */
function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'mb-4 flex flex-col gap-1.5',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  );
}

/** 对话框标题 */
const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={[
      'text-lg font-semibold text-on-surface',
      className ?? '',
    ].join(' ')}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

/** 对话框描述文字 */
const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<
    typeof DialogPrimitive.Description
  >
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={[
      'text-sm text-on-surface-variant',
      className ?? '',
    ].join(' ')}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

/** 对话框底部操作区 */
function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'mt-6 flex justify-end gap-3',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};
