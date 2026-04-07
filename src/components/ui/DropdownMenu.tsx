import {
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface DropdownMenuProps {
  trigger: ReactNode;
  className?: string;
}

/** 下拉菜单，点击触发器展开/收起 */
export function DropdownMenu({
  trigger,
  className,
  children,
}: PropsWithChildren<DropdownMenuProps>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {trigger}
      </button>
      {open ? (
        <div
          className={[
            'absolute right-0 top-full z-50 mt-1 min-w-[120px]',
            'rounded-[var(--radius)] bg-[var(--surface-high)]',
            'border border-[var(--outline)] shadow-lg',
            'animate-in py-1',
            className ?? '',
          ].join(' ')}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

interface DropdownMenuItemProps {
  onClick?: () => void;
  danger?: boolean;
}

/** 下拉菜单选项 */
export function DropdownMenuItem({
  onClick,
  danger,
  children,
}: PropsWithChildren<DropdownMenuItemProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 px-3 py-1.5 text-sm',
        'hover:bg-[var(--surface-elevated)] transition-colors',
        danger
          ? 'text-[var(--danger)]'
          : 'text-[var(--text)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
