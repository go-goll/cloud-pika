import { useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { SettingsPanel } from './SettingsPanel';
import {
  useSaveSettingsMutation,
  useSettingsQuery,
} from '@/hooks/useCloudApi';
import { useAppStore } from '@/stores/useAppStore';
import {
  normalizeLocale,
  resolveSystemLocale,
} from '@/lib/locale';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** 右侧抽屉式设置面板，包含自动保存逻辑 */
export function SettingsDrawer({
  open,
  onClose,
}: SettingsDrawerProps) {
  const { t } = useTranslation();

  const themeMode = useAppStore((s) => s.themeMode);
  const settings = useAppStore((s) => s.settings);
  const setLocale = useAppStore((s) => s.setLocale);
  const setThemeMode = useAppStore(
    (s) => s.setThemeMode,
  );
  const setSettings = useAppStore((s) => s.setSettings);

  const query = useSettingsQuery();
  const mutation = useSaveSettingsMutation();

  const initialized = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // 从后端同步设置到前端状态
  useEffect(() => {
    if (!query.data) return;

    setSettings(query.data);
    const nextLocale =
      query.data.language === 'system'
        ? resolveSystemLocale()
        : normalizeLocale(query.data.language);
    setLocale(nextLocale);
    void i18n.changeLanguage(nextLocale);
    setThemeMode(query.data.theme);

    requestAnimationFrame(() => {
      initialized.current = true;
    });
  }, [query.data, setLocale, setSettings, setThemeMode]);

  // 设置变更时自动保存（debounce 800ms）
  useEffect(() => {
    if (!initialized.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void mutation.mutateAsync(settings);
    }, 800);
    return () => clearTimeout(timerRef.current);
  }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            'fixed inset-0 z-50',
            'bg-black/30 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in',
            'data-[state=closed]:animate-[fadeOut_100ms_ease-in]',
          ].join(' ')}
        />
        <Dialog.Content
          className={[
            'fixed right-0 top-0 z-50',
            'h-full w-[440px]',
            'rounded-l-2xl',
            'bg-[var(--bg-card)]',
            'shadow-xl',
            'p-6 overflow-y-auto',
            'animate-slide-in-right',
          ].join(' ')}
        >
          {/* 标题栏 */}
          <div
            className={[
              'flex items-center justify-between',
              'mb-6 pb-4',
              'border-b border-[var(--border)]',
            ].join(' ')}
          >
            <Dialog.Title
              className={[
                'font-display text-lg font-semibold',
                'text-[var(--text)]',
              ].join(' ')}
            >
              {t('settings.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className={[
                  'flex h-8 w-8 items-center',
                  'justify-center',
                  'rounded-lg',
                  'text-[var(--text-secondary)]',
                  'hover:bg-[var(--bg-raised)]',
                  'hover:text-[var(--text)]',
                  'transition-all duration-150',
                  'active:scale-90',
                ].join(' ')}
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* 设置面板 */}
          <SettingsPanel
            settings={settings}
            themeMode={themeMode}
            language={settings.language}
            onThemeModeChange={(mode) => {
              setThemeMode(mode);
              setSettings({ ...settings, theme: mode });
            }}
            onLocaleChange={(nextLocale) => {
              if (nextLocale === 'system') {
                const resolved = resolveSystemLocale();
                setSettings({
                  ...settings,
                  language: 'system',
                });
                setLocale(resolved);
                void i18n.changeLanguage(resolved);
                return;
              }
              setSettings({
                ...settings,
                language: nextLocale,
              });
              setLocale(nextLocale);
              void i18n.changeLanguage(nextLocale);
            }}
            onSettingsChange={(patch) =>
              setSettings({ ...settings, ...patch })
            }
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
