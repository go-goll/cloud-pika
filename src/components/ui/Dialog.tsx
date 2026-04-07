import {
  type MouseEvent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

/** 模态对话框，点击遮罩层或按 ESC 关闭 */
export function Dialog({
  open,
  onClose,
  className,
  children,
}: PropsWithChildren<DialogProps>) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleOverlayClick = useCallback(
    (e: MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        className={[
          'animate-in rounded-[var(--radius)]',
          'bg-[var(--surface-high)] p-5 shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          className ?? '',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
