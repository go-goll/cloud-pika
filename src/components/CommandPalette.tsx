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
  Settings2,
  Sun,
  Workflow,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

/** 全局命令面板，通过 Cmd+K / Ctrl+K 唤起 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);

  /* 全局快捷键监听 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /** 执行命令后关闭面板 */
  const run = useCallback(
    (fn: () => void) => {
      fn();
      setOpen(false);
    },
    [],
  );

  /** 切换主题 */
  const toggleTheme = useCallback(() => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  }, [themeMode, setThemeMode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* 命令面板 */}
      <div className="flex items-start justify-center pt-[20vh]">
        <Command
          className={[
            'relative w-full max-w-lg overflow-hidden rounded-[var(--radius)]',
            'bg-[var(--surface-high)] shadow-2xl',
            'border border-[var(--outline)]',
          ].join(' ')}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          {/* 搜索框 */}
          <Command.Input
            placeholder={t('command.placeholder')}
            className={[
              'w-full border-b border-[var(--outline)]',
              'bg-transparent px-4 py-3 text-base',
              'text-[var(--text)] placeholder:text-[var(--text-muted)]',
              'focus:outline-none',
            ].join(' ')}
          />

          <Command.List
            className="max-h-72 overflow-y-auto p-2"
          >
            <Command.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
              {t('common.search')} ...
            </Command.Empty>

            {/* 导航分组 */}
            <Command.Group
              heading={t('command.navigation')}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
            >
              <CommandItem
                icon={<KeyRound size={16} />}
                label={t('command.goAccounts')}
                onSelect={() => run(() => navigate('/login'))}
              />
              <CommandItem
                icon={<FolderKanban size={16} />}
                label={t('command.goExplorer')}
                onSelect={() => run(() => navigate('/bucket'))}
              />
              <CommandItem
                icon={<Workflow size={16} />}
                label={t('command.goTransfers')}
                onSelect={() => run(() => navigate('/transfers'))}
              />
              <CommandItem
                icon={<Settings2 size={16} />}
                label={t('command.goSettings')}
                onSelect={() => run(() => navigate('/settings'))}
              />
            </Command.Group>

            {/* 操作分组 */}
            <Command.Group
              heading={t('command.actions')}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
            >
              <CommandItem
                icon={<Rocket size={16} />}
                label={t('command.uploadFiles')}
                onSelect={() =>
                  run(() =>
                    window.dispatchEvent(
                      new CustomEvent('cloud-pika:upload-active'),
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
                      new CustomEvent('cloud-pika:refresh-active'),
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
        'flex cursor-pointer items-center gap-3 rounded-[var(--radius)]',
        'px-3 py-2 text-sm text-[var(--text)]',
        'aria-selected:bg-[var(--surface-elevated)]',
        'hover:bg-[var(--surface-elevated)]',
      ].join(' ')}
    >
      <span className="text-[var(--text-muted)]">{icon}</span>
      {label}
    </Command.Item>
  );
}
