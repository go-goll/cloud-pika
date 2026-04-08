interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  /** 面包屑项列表，最后一项为当前页 */
  items: BreadcrumbItem[];
  /** 自定义类名 */
  className?: string;
}

/** 面包屑导航组件 */
export function Breadcrumb({
  items,
  className,
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={[
        'flex items-center gap-1.5 text-sm',
        className ?? '',
      ].join(' ')}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span
            key={index}
            className="flex items-center gap-1.5"
          >
            {index > 0 && (
              <span className="text-on-surface-variant/50 select-none">
                ›
              </span>
            )}
            {isLast ? (
              <span className="font-headline font-bold text-on-surface">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className={[
                  'text-on-surface-variant',
                  'hover:text-on-surface',
                  'hover:underline underline-offset-2',
                  'transition-colors',
                ].join(' ')}
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
