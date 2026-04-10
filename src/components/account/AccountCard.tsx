import { useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { getProviderOption } from '@/lib/provider';
import type { AccountSummary } from '@/types/account';

interface AccountCardProps {
  account: AccountSummary;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/** 已保存账户卡片，支持点击选中和删除 */
export function AccountCard({
  account,
  onSelect,
  onDelete,
}: AccountCardProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const provider = getProviderOption(account.provider);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(account.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSelect(account.id);
        }}
        className={[
          'group flex items-center gap-3',
          'rounded-xl border border-[var(--border)] p-4',
          'tonal-hover cursor-pointer',
          'transition-all duration-200',
        ].join(' ')}
      >
        {/* Provider 图标 */}
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center',
            'justify-center rounded-lg',
            'bg-[var(--accent-soft)]',
            'text-sm font-bold text-[var(--accent)]',
          ].join(' ')}
        >
          {provider.label.charAt(0).toUpperCase()}
        </div>

        {/* 账户信息 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text)]">
            {account.name}
          </p>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            {provider.label}
          </p>
        </div>

        {/* 删除按钮（hover 显示） */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-red-50 hover:text-[var(--danger)] transition-all"
        >
          <Trash2 size={14} />
        </button>

        {/* 右侧箭头 */}
        <ChevronRight
          size={16}
          className="shrink-0 text-[var(--text-secondary)] transition-transform group-hover:translate-x-0.5"
        />
      </div>

      {/* 删除确认对话框 */}
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <DialogContent className="w-80">
          <DialogHeader>
            <DialogTitle>
              {t('login.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('login.deleteConfirmDesc', {
                name: account.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onDelete(account.id);
                setConfirmOpen(false);
              }}
            >
              <Trash2 size={14} className="mr-1" />
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
