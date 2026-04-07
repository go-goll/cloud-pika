/**
 * BreadcrumbNav - 面包屑路径导航组件
 * 根据当前prefix解析路径层级，支持点击跳转到任意层级
 */
import { useTranslation } from 'react-i18next';
import { ChevronRight, Cloud } from 'lucide-react';

interface BreadcrumbNavProps {
  bucket: string;
  prefix: string;
  onNavigate: (prefix: string) => void;
}

/** 将prefix字符串解析为路径段数组 */
function parsePrefixSegments(prefix: string): string[] {
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
    <nav className="flex items-center gap-1 text-sm">
      {/* 根Bucket入口 */}
      <button
        type="button"
        onClick={() => onNavigate('')}
        className={[
          'flex items-center gap-1.5 rounded-[var(--radius)]',
          'px-2 py-1 transition-colors',
          'hover:bg-[var(--surface-elevated)]',
          segments.length === 0
            ? 'font-medium text-[var(--text)]'
            : 'text-[var(--text-muted)]',
        ].join(' ')}
      >
        <Cloud size={14} className="text-[var(--primary)]" />
        <span>{bucket}</span>
      </button>

      {/* 路径段 */}
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        // 拼接到当前段的prefix路径
        const targetPrefix = segments
          .slice(0, index + 1)
          .join('/') + '/';

        return (
          <div key={targetPrefix} className="flex items-center gap-1">
            <ChevronRight
              size={12}
              className="text-[var(--text-muted)]"
            />
            <button
              type="button"
              onClick={() => onNavigate(targetPrefix)}
              className={[
                'rounded-[var(--radius)] px-2 py-1',
                'transition-colors',
                'hover:bg-[var(--surface-elevated)]',
                isLast
                  ? 'font-medium text-[var(--text)]'
                  : 'text-[var(--text-muted)]',
              ].join(' ')}
            >
              {segment}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
