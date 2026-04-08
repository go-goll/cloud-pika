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
      <div className="h-4 w-4 animate-pulse rounded bg-surface-container-low" />
      <div className="h-4 flex-1 animate-pulse rounded bg-surface-container-low" />
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
    <div className="rounded-xl bg-surface-container-lowest ghost-border p-3">
      {/* 标题和数量统计 */}
      <div className="flex items-center justify-between px-2 pb-2">
        <h3 className="font-headline text-sm font-semibold text-on-surface">
          {t('bucket.title')}
        </h3>
        <span className="text-xs text-on-surface-variant">
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
                  'rounded-lg px-3 py-2',
                  'text-left text-sm transition-all',
                  isActive
                    ? [
                        'bg-primary/10 font-medium',
                        'border-l-2 border-primary',
                      ].join(' ')
                    : [
                        'hover:bg-surface-container-low',
                        'border-l-2 border-transparent',
                      ].join(' '),
                ].join(' ')}
              >
                <Database
                  size={14}
                  className={
                    isActive
                      ? 'text-primary'
                      : 'text-on-surface-variant'
                  }
                />
                <span className="flex-1 truncate">
                  {bucket.name}
                </span>
                {bucket.location ? (
                  <span className="text-xs text-on-surface-variant">
                    {bucket.location}
                  </span>
                ) : null}
              </button>
            );
          })
        )}

        {/* 空状态 */}
        {!isLoading && buckets.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-on-surface-variant">
            {t('bucket.empty')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
