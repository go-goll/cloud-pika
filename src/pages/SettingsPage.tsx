import { useEffect, useRef } from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import {
  useSaveSettingsMutation,
  useSettingsQuery,
} from '@/hooks/useCloudApi';
import { useAppStore } from '@/stores/useAppStore';
import {
  normalizeLocale,
  resolveSystemLocale,
} from '@/lib/locale';

/** 设置页面，两列布局对齐 digital-obsidian */
export function SettingsPage() {
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

  // 防止初始加载时触发自动保存
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

    // 标记初始化完成（下一个 tick，避免与 settings 同步 effect 竞争）
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface font-headline">
          {t('settings.title')}
        </h1>
        <p className="text-on-surface-variant text-lg">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* 设置内容 */}
      <div className="bg-surface-container-lowest rounded-2xl ghost-border p-8 shadow-sm">
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
      </div>
    </div>
  );
}
