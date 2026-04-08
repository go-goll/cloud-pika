import { useEffect } from 'react';
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
import { toast } from '@/lib/toast';

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
  }, [query.data, setLocale, setSettings, setThemeMode]);

  /** 保存设置并提示用户 */
  const handleSave = async () => {
    await mutation.mutateAsync(settings);
    toast.success(t('settings.saveSuccess'));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface font-headline">
          {t('settings.title')}
        </h1>
        <p className="text-on-surface-variant text-lg">
          {t('transfer.subtitle')}
        </p>
      </div>

      {/* 设置内容 */}
      <div className="bg-surface-container-lowest rounded-2xl ghost-border p-8 shadow-sm">
        <SettingsPanel
          settings={settings}
          themeMode={themeMode}
          language={settings.language}
          isSaving={mutation.isPending}
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
          onSave={() => void handleSave()}
        />
      </div>
    </div>
  );
}
