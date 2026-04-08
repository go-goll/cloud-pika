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
    <nav className="flex items-center gap-1 text-sm">
      {/* 根Bucket入口 */}
      <button
        type="button"
        onClick={() => onNavigate('')}
        className={[
          'flex items-center gap-1.5 rounded-lg',
          'px-2 py-1 transition-colors',
          'hover:bg-surface-container-low',
          segments.length === 0
            ? 'font-headline font-bold text-on-surface'
            : 'text-on-surface-variant',
        ].join(' ')}
      >
        <Cloud size={14} className="text-primary" />
        <span>{bucket}</span>
      </button>

      {/* 路径段 */}
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const targetPrefix =
          segments.slice(0, index + 1).join('/') + '/';

        return (
          <div
            key={targetPrefix}
            className="flex items-center gap-1"
          >
            <ChevronRight
              size={12}
              className="text-on-surface-variant/50"
            />
            <button
              type="button"
              onClick={() => onNavigate(targetPrefix)}
              className={[
                'rounded-lg px-2 py-1',
                'transition-colors',
                'hover:bg-surface-container-low',
                isLast
                  ? 'font-headline font-bold text-on-surface'
                  : 'text-on-surface-variant',
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
