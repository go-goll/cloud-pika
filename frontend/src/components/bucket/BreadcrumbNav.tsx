/**
 * BreadcrumbNav - 面包屑路径导航组件
 * 根据当前prefix解析路径层级，支持点击跳转到任意层级
 */
import { useTranslation } from 'react-i18next';
import { Cloud } from 'lucide-react';

interface BreadcrumbNavProps {
  bucket: string;
  prefix: string;
  onNavigate: (prefix: string) => void;
}

/** 将prefix字符串解析为路径段数组 */
function parsePrefixSegments(
  prefix: string,
): string[] {
  if (!prefix) return [];
  return prefix
    .split('/')
    .filter((seg) => seg.length > 0);
}

export function BreadcrumbNav({
  bucket,
  prefix,
  onNavigate,
}: BreadcrumbNavProps) {
  const { t } = useTranslation();
  const segments = parsePrefixSegments(prefix);

  if (!bucket) return null;

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
      {/* 根Bucket入口 */}
      <button
        type="button"
        onClick={() => onNavigate('')}
        title={bucket}
        className={[
          'flex min-w-0 items-center gap-1.5 rounded-[8px]',
          'px-2 py-1 transition-colors',
          'hover:bg-[var(--bg-raised)]',
          segments.length === 0
            ? 'font-medium text-[var(--text)]'
            : 'text-[var(--text-secondary)]',
        ].join(' ')}
      >
        <Cloud size={14} className="shrink-0 text-[var(--accent)]" />
        <span className="truncate">{bucket}</span>
      </button>

      {/* 路径段 */}
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const targetPrefix =
          segments.slice(0, index + 1).join('/') + '/';

        return (
          <div
            key={targetPrefix}
            className="flex min-w-0 items-center gap-1"
          >
            <span className="text-[var(--text-secondary)]/50">/</span>
            <button
              type="button"
              onClick={() => onNavigate(targetPrefix)}
              title={segment}
              className={[
                'min-w-0 rounded-[8px] px-2 py-1',
                'transition-colors',
                'hover:bg-[var(--bg-raised)]',
                isLast
                  ? 'font-medium text-[var(--text)]'
                  : 'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              <span className="block truncate">{segment}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
