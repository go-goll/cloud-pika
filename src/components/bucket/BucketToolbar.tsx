/**
 * BucketToolbar - 顶部工具栏组件
 * 包含搜索框（防抖）、视图切换、上传和刷新按钮
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid3x3,
  LayoutList,
  RefreshCcw,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export type ViewMode = 'table' | 'grid';

interface BucketToolbarProps {
  view: ViewMode;
  selectedCount: number;
  onViewChange: (view: ViewMode) => void;
  onSearch: (keyword: string) => void;
  onUpload: () => void;
  onRefresh: () => void;
}

/** 搜索防抖延迟（毫秒） */
const DEBOUNCE_MS = 300;

export function BucketToolbar({
  view,
  selectedCount,
  onViewChange,
  onSearch,
  onUpload,
  onRefresh,
}: BucketToolbarProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // 防抖搜索
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(value);
      }, DEBOUNCE_MS);
    },
    [onSearch],
  );

  // 清除搜索
  const handleClear = useCallback(() => {
    setInputValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearch('');
  }, [onSearch]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* 左侧：搜索框 */}
      <div className="relative max-w-[360px] flex-1">
        <Search
          size={16}
          className={[
            'pointer-events-none absolute left-3',
            'top-1/2 -translate-y-1/2',
            'text-on-surface-variant',
          ].join(' ')}
        />
        <Input
          value={inputValue}
          onChange={(e) =>
            handleInputChange(e.target.value)
          }
          placeholder={t('common.search')}
          className="pl-9 pr-8"
        />
        {inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className={[
              'absolute right-2.5 top-1/2',
              '-translate-y-1/2',
              'text-on-surface-variant',
              'hover:text-on-surface',
            ].join(' ')}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 选中数量提示 */}
        {selectedCount > 0 ? (
          <span className="text-xs font-bold text-primary">
            {t('bucket.selectedCount', {
              count: selectedCount,
            })}
          </span>
        ) : null}

        {/* 视图切换按钮组 */}
        <div className="flex overflow-hidden rounded-lg ghost-border">
          <button
            type="button"
            onClick={() => onViewChange('table')}
            className={[
              'flex items-center gap-1.5 px-3 py-2',
              'text-xs transition-colors',
              view === 'table'
                ? [
                    'bg-surface-container-lowest',
                    'font-bold text-on-surface',
                    'shadow-sm',
                  ].join(' ')
                : [
                    'text-on-surface-variant',
                    'hover:text-on-surface',
                    'bg-surface-container-low',
                  ].join(' '),
            ].join(' ')}
          >
            <LayoutList size={14} />
            {t('bucket.table')}
          </button>
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={[
              'flex items-center gap-1.5 px-3 py-2',
              'text-xs transition-colors',
              view === 'grid'
                ? [
                    'bg-surface-container-lowest',
                    'font-bold text-on-surface',
                    'shadow-sm',
                  ].join(' ')
                : [
                    'text-on-surface-variant',
                    'hover:text-on-surface',
                    'bg-surface-container-low',
                  ].join(' '),
            ].join(' ')}
          >
            <Grid3x3 size={14} />
            {t('bucket.grid')}
          </button>
        </div>

        {/* 刷新 */}
        <Button variant="ghost" onClick={onRefresh}>
          <RefreshCcw size={15} />
        </Button>

        {/* 上传 */}
        <Button onClick={onUpload}>
          <UploadCloud size={15} className="mr-1.5" />
          {t('bucket.upload')}
        </Button>
      </div>
    </div>
  );
}
