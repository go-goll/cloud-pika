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
  FolderPlus,
  Grid3x3,
  LayoutList,
  Link2,
  RefreshCcw,
  Search,
  Settings2,
  UploadCloud,
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
  /** 远程抓取回调（仅当 provider 支持时传入） */
  onFetchUrl?: () => void;
  /** 新建文件夹回调 */
  onCreateFolder?: () => void;
  /** Bucket 设置回调（仅当有治理功能时传入） */
  onSettings?: () => void;
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
  onFetchUrl,
  onCreateFolder,
  onSettings,
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

  /** 视图切换按钮样式 */
  const viewBtnClass = (active: boolean) => [
    'flex items-center gap-1.5 px-3 py-2',
    'text-xs rounded-[8px] transition-all duration-200',
    active
      ? 'bg-[var(--bg-card)] font-semibold text-[var(--text)] shadow-sm'
      : 'text-[var(--text-secondary)] hover:text-[var(--text)]',
  ].join(' ');

  return (
    <div
      className={[
        'flex flex-wrap items-center',
        'justify-between gap-3',
      ].join(' ')}
    >
      {/* 左侧：搜索框（复用 Input 内置图标与清除按钮） */}
      <div className="max-w-[360px] flex-1">
        <Input
          icon={<Search size={16} />}
          clearable
          onClear={handleClear}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t('common.search')}
          className="bg-[var(--bg-raised)]"
        />
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 选中数量提示 */}
        {selectedCount > 0 ? (
          <span
            className={[
              'text-xs font-semibold',
              'text-[var(--accent)]',
              'bg-[var(--accent-soft)]',
              'px-2 py-1 rounded-[8px]',
            ].join(' ')}
          >
            {t('bucket.selectedCount', {
              count: selectedCount,
            })}
          </span>
        ) : null}

        {/* 视图切换按钮组 */}
        <div
          className={[
            'flex overflow-hidden rounded-[8px]',
            'bg-[var(--bg-raised)] p-0.5',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => onViewChange('table')}
            className={viewBtnClass(view === 'table')}
          >
            <LayoutList size={14} />
            {t('bucket.table')}
          </button>
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={viewBtnClass(view === 'grid')}
          >
            <Grid3x3 size={14} />
            {t('bucket.grid')}
          </button>
        </div>

        {/* 新建文件夹 */}
        {onCreateFolder ? (
          <Button
            variant="ghost"
            iconOnly
            className="rounded-[8px]"
            onClick={onCreateFolder}
            title={t('bucket.newFolder')}
            aria-label={t('bucket.newFolder')}
          >
            <FolderPlus size={15} />
          </Button>
        ) : null}

        {/* 远程抓取 */}
        {onFetchUrl ? (
          <Button
            variant="ghost"
            className="rounded-[8px]"
            onClick={onFetchUrl}
          >
            <Link2 size={15} className="mr-1.5" />
            {t('bucket.fetchUrl')}
          </Button>
        ) : null}

        {/* Bucket 设置 */}
        {onSettings ? (
          <Button
            variant="ghost"
            iconOnly
            className="rounded-[8px]"
            onClick={onSettings}
            title={t('bucketSettings.title')}
            aria-label={t('bucketSettings.title')}
          >
            <Settings2 size={15} />
          </Button>
        ) : null}

        {/* 刷新 */}
        <Button
          variant="ghost"
          iconOnly
          className="rounded-[8px]"
          onClick={onRefresh}
          title={t('common.refresh')}
          aria-label={t('common.refresh')}
        >
          <RefreshCcw size={15} />
        </Button>

        {/* 上传按钮 - 品牌色 */}
        <Button className="rounded-[8px]" onClick={onUpload}>
          <UploadCloud size={15} className="mr-1.5" />
          {t('bucket.upload')}
        </Button>
      </div>
    </div>
  );
}
