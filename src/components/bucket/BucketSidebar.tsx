/**
 * BucketSidebar - 左侧Bucket列表组件
 * 显示所有存储空间名称，支持点击切换和加载骨架屏
 */
import { useTranslation } from 'react-i18next';
import { Database } from 'lucide-react';
import type { BucketInfo } from '@/types/cloud';

interface BucketSidebarProps {
  buckets: BucketInfo[];
  activeBucket: string;
  isLoading: boolean;
  onSelect: (name: string) => void;
}

/** 加载骨架屏占位 */
function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div
        className={
          'h-4 w-4 animate-pulse rounded '
          + 'bg-[var(--surface-elevated)]'
        }
      />
      <div
        className={
          'h-4 flex-1 animate-pulse rounded '
          + 'bg-[var(--surface-elevated)]'
        }
      />
    </div>
  );
}

export function BucketSidebar({
  buckets,
  activeBucket,
  isLoading,
  onSelect,
}: BucketSidebarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={
        'rounded-[calc(var(--radius)+2px)] '
        + 'bg-[var(--surface-low)] p-3'
      }
    >
      {/* 标题和数量统计 */}
      <div className="flex items-center justify-between px-2 pb-2">
        <h3 className="text-sm font-semibold">
          {t('bucket.title')}
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          {buckets.length}
        </span>
      </div>

      {/* Bucket列表 */}
      <div className="space-y-0.5">
        {isLoading ? (
          <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </>
        ) : (
          buckets.map((bucket) => {
            const isActive = activeBucket === bucket.name;
            return (
              <button
                key={bucket.name}
                type="button"
                onClick={() => onSelect(bucket.name)}
                className={[
                  'flex w-full items-center gap-2.5',
                  'rounded-[var(--radius)] px-3 py-2',
                  'text-left text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--surface-elevated)] font-medium'
                    : 'hover:bg-[var(--surface-elevated)]/70',
                ].join(' ')}
              >
                <Database
                  size={14}
                  className={
                    isActive
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--text-muted)]'
                  }
                />
                <span className="flex-1 truncate">
                  {bucket.name}
                </span>
                {bucket.location ? (
                  <span className="text-xs text-[var(--text-muted)]">
                    {bucket.location}
                  </span>
                ) : null}
              </button>
            );
          })
        )}

        {/* 空状态 */}
        {!isLoading && buckets.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
            {t('bucket.empty')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
