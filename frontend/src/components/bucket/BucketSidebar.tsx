/**
 * BucketSidebar - 左侧Bucket列表组件
 * 显示所有存储空间名称，支持点击切换、加载骨架屏、进入动画
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
        className={[
          'h-4 w-4 rounded',
          'bg-[var(--bg-raised)] animate-pulse',
        ].join(' ')}
      />
      <div
        className={[
          'h-4 flex-1 rounded',
          'bg-[var(--bg-raised)] animate-pulse',
        ].join(' ')}
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
      className={[
        'w-[220px] shrink-0 rounded-xl',
        'bg-[var(--bg)] ghost-border',
        'p-3 overflow-y-auto',
        'shadow-[var(--shadow-xs)]',
      ].join(' ')}
    >
      {/* 标题和数量统计 */}
      <div className="flex items-center justify-between px-2 pb-2">
        <h3
          className={[
            'font-display text-sm font-semibold',
            'text-[var(--text)]',
          ].join(' ')}
        >
          {t('bucket.title')}
        </h3>
        <span
          className={[
            'text-xs font-medium',
            'text-[var(--text-secondary)]',
            'bg-[var(--bg-raised)]',
            'px-1.5 py-0.5 rounded-md',
          ].join(' ')}
        >
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
          buckets.map((bucket, index) => {
            const isActive =
              activeBucket === bucket.name;
            return (
              <button
                key={bucket.name}
                type="button"
                onClick={() => onSelect(bucket.name)}
                className={[
                  'flex w-full items-center gap-2.5',
                  'rounded-lg px-3 py-2',
                  'text-left text-sm transition-all',
                  'duration-150',
                  'animate-slide-in-up',
                  isActive
                    ? [
                        'bg-[var(--accent-soft)]',
                        'text-[var(--accent)]',
                        'font-medium',
                        'shadow-[var(--shadow-xs)]',
                      ].join(' ')
                    : [
                        'hover:bg-[var(--bg-raised)]',
                        'text-[var(--text-secondary)]',
                        'hover:text-[var(--text)]',
                      ].join(' '),
                ].join(' ')}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <Database
                  size={14}
                  className={
                    isActive
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-secondary)]'
                  }
                />
                <span className="flex-1 truncate">
                  {bucket.name}
                </span>
                {bucket.location ? (
                  <span
                    className={[
                      'text-[10px]',
                      'text-[var(--text-secondary)]',
                      'bg-[var(--bg-raised)]',
                      'px-1.5 py-0.5 rounded',
                    ].join(' ')}
                  >
                    {bucket.location}
                  </span>
                ) : null}
              </button>
            );
          })
        )}

        {/* 空状态 */}
        {!isLoading && buckets.length === 0 ? (
          <p
            className={[
              'px-3 py-4 text-center text-xs',
              'text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {t('bucket.empty')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
