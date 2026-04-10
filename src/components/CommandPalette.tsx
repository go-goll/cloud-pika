import { useCallback, useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderKanban,
  KeyRound,
  Moon,
  RefreshCcw,
  Rocket,
  Search,
  Settings2,
  Sun,
  Workflow,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAccountStore } from '@/stores/useAccountStore';

/** 全局命令面板，通过 Cmd+K / Ctrl+K 唤起 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAccountDialogOpen = useAccountStore(
    (s) => s.setAccountDialogOpen,
  );
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore(
    (s) => s.setThemeMode,
  );

  /* 全局快捷键监听 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () =>
      window.removeEventListener('keydown', handler);
  }, []);

  /** 执行命令后关闭面板 */
  const run = useCallback((fn: () => void) => {
    fn();
    setOpen(false);
  }, []);

  /** 切换主题 */
  const toggleTheme = useCallback(() => {
    const next =
      themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  }, [themeMode, setThemeMode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* 居中面板 */}
      <div className="flex items-start justify-center pt-[20vh]">
        <Command
          className={[
            'relative w-full max-w-lg',
            'overflow-hidden rounded-2xl',
            'bg-[var(--bg-card)] shadow-xl',
            'border border-[var(--border)]',
          ].join(' ')}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          {/* 搜索区域 */}
          <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
            <Search
              size={20}
              className="shrink-0 text-[var(--text-secondary)]"
            />
            <Command.Input
              placeholder={t('command.placeholder')}
              className={[
                'flex-1 bg-transparent py-3 text-base',
                'text-[var(--text)]',
                'placeholder:text-[var(--text-secondary)]',
                'border-none focus:outline-none',
              ].join(' ')}
            />
            <kbd className="shrink-0 text-[10px] uppercase tracking-wider bg-[var(--bg-raised)] text-[var(--text-secondary)] rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          {/* 结果区域 */}
          <Command.List className="max-h-72 overflow-y-auto py-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--text-secondary)]">
              {t('common.search')} ...
            </Command.Empty>

            {/* 导航分组 */}
            <Command.Group
              heading={t('command.navigation')}
              className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.05em] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-[var(--text-secondary)] [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
            >
              <CommandItem
                icon={<KeyRound size={16} />}
                label={t('command.goAccounts')}
                onSelect={() =>
                  run(() => setAccountDialogOpen(true))
                }
              />
              <CommandItem
                icon={<FolderKanban size={16} />}
                label={t('command.goExplorer')}
                onSelect={() =>
                  run(() => navigate('/bucket'))
                }
              />
              <CommandItem
                icon={<Workflow size={16} />}
                label={t('command.goTransfers')}
                onSelect={() =>
                  run(() => navigate('/transfers'))
                }
              />
              <CommandItem
                icon={<Settings2 size={16} />}
                label={t('command.goSettings')}
                onSelect={() =>
                  run(() => navigate('/settings'))
                }
              />
            </Command.Group>

            {/* 操作分组 */}
            <Command.Group
              heading={t('command.actions')}
              className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.05em] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-[var(--text-secondary)] [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
            >
              <CommandItem
                icon={<Rocket size={16} />}
                label={t('command.uploadFiles')}
                onSelect={() =>
                  run(() =>
                    window.dispatchEvent(
                      new CustomEvent(
                        'cloud-pika:upload-active',
                      ),
                    ),
                  )
                }
              />
              <CommandItem
                icon={<RefreshCcw size={16} />}
                label={t('command.refresh')}
                onSelect={() =>
                  run(() =>
                    window.dispatchEvent(
                      new CustomEvent(
                        'cloud-pika:refresh-active',
                      ),
                    ),
                  )
                }
              />
              <CommandItem
                icon={
                  themeMode === 'dark' ? (
                    <Sun size={16} />
                  ) : (
                    <Moon size={16} />
                  )
                }
                label={t('command.toggleTheme')}
                onSelect={() => run(toggleTheme)}
              />
            </Command.Group>
          </Command.List>

          {/* 底部工具栏 */}
          <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2.5 text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 text-xs">
              <kbd className="text-[10px] bg-[var(--bg-raised)] rounded px-1.5 py-0.5">
                &uarr;&darr;
              </kbd>
              {t('command.hintNavigate', '导航')}
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <kbd className="text-[10px] bg-[var(--bg-raised)] rounded px-1.5 py-0.5">
                &crarr;
              </kbd>
              {t('command.hintOpen', '打开')}
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <kbd className="text-[10px] bg-[var(--bg-raised)] rounded px-1.5 py-0.5">
                ESC
              </kbd>
              {t('command.hintClose', '关闭')}
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

/** 命令面板列表项 */
function CommandItem({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={[
        'flex cursor-pointer items-center gap-3',
        'mx-2 rounded-xl px-4 py-2.5 text-sm',
        'text-[var(--text)]',
        'aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--accent)]',
        'hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]',
      ].join(' ')}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
        {icon}
      </span>
      {label}
    </Command.Item>
  );
}
