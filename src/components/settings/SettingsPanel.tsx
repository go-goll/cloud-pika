import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { AppSettings } from '@/types/cloud';
import type { ThemeMode } from '@/types/common';

interface SettingsPanelProps {
  settings: AppSettings;
  themeMode: ThemeMode;
  language: AppSettings['language'];
  onThemeModeChange: (mode: ThemeMode) => void;
  onLocaleChange: (locale: AppSettings['language']) => void;
  onSettingsChange: (patch: Partial<AppSettings>) => void;
  onSave: () => void;
}

export function SettingsPanel({
  settings,
  themeMode,
  language,
  onThemeModeChange,
  onLocaleChange,
  onSettingsChange,
  onSave,
}: SettingsPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-[var(--text-muted)]">{t('common.theme')}</span>
          <Select
            value={themeMode}
            onChange={(val) => onThemeModeChange(val as ThemeMode)}
            options={[
              { value: 'system', label: t('settings.system') },
              { value: 'light', label: t('settings.light') },
              { value: 'dark', label: t('settings.dark') },
            ]}
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-[var(--text-muted)]">{t('common.language')}</span>
          <Select
            value={language}
            onChange={(val) => onLocaleChange(
              val as AppSettings['language']
            )}
            options={[
              { value: 'system', label: t('settings.system') },
              { value: 'zh-CN', label: t('settings.chinese') },
              { value: 'en-US', label: t('settings.english') },
            ]}
          />
        </label>
      </div>

      <div className="grid gap-3 text-sm">
        <label className="flex items-center justify-between rounded-[var(--radius)] bg-[var(--surface-low)] px-3 py-2.5">
          <span>{t('settings.https')}</span>
          <input
            type="checkbox"
            checked={settings.https}
            onChange={(event) => onSettingsChange({ https: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between rounded-[var(--radius)] bg-[var(--surface-low)] px-3 py-2.5">
          <span>{t('settings.hideDelete')}</span>
          <input
            type="checkbox"
            checked={settings.hideDeleteButton}
            onChange={(event) => onSettingsChange({ hideDeleteButton: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between rounded-[var(--radius)] bg-[var(--surface-low)] px-3 py-2.5">
          <span>{t('settings.paging')}</span>
          <input
            type="checkbox"
            checked={settings.paging}
            onChange={(event) => onSettingsChange({ paging: event.target.checked })}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave}>{t('common.save')}</Button>
      </div>
    </Card>
  );
}
