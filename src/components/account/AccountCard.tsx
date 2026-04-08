import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { getProviderOption } from '@/lib/provider';
import type { AccountSummary } from '@/types/account';

interface AccountCardProps {
  account: AccountSummary;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/** 已保存账户卡片，支持点击选中、编辑和删除 */
export function AccountCard({
  account,
  onSelect,
  onDelete,
}: AccountCardProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const provider = getProviderOption(account.provider);

  const formattedDate = new Date(account.createdAt)
    .toLocaleDateString();

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
          'group relative flex items-center gap-3',
          'rounded-[var(--radius)] bg-[var(--surface-high)] p-3',
          'cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:-translate-y-0.5',
          'border border-transparent',
          'hover:border-[var(--outline)]',
        ].join(' ')}
      >
        {/* 云厂商首字母图标 */}
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center',
            'justify-center rounded-full',
            'bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]',
            'text-sm font-semibold text-[var(--primary)]',
          ].join(' ')}
        >
          {provider.label.charAt(0).toUpperCase()}
        </div>

        {/* 账户信息 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {account.name}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {provider.label}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {formattedDate}
          </p>
        </div>

        {/* 右上角菜单 */}
        <div
          className="absolute right-2 top-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <DropdownMenu
            trigger={
              <span
                className={[
                  'flex h-7 w-7 items-center justify-center',
                  'rounded-full text-[var(--text-muted)]',
                  'opacity-0 transition-opacity',
                  'group-hover:opacity-100',
                  'hover:bg-[var(--surface-elevated)]',
                ].join(' ')}
              >
                <MoreVertical size={14} />
              </span>
            }
          >
            <DropdownMenuItem
              onClick={() => onSelect(account.id)}
            >
              <Pencil size={14} />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              danger
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        className="w-80"
      >
        <h3 className="text-sm font-semibold">
          {t('login.deleteConfirmTitle')}
        </h3>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {t('login.deleteConfirmDesc', {
            name: account.name,
          })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
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
            {t('common.delete')}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
