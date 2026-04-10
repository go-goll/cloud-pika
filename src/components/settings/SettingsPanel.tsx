import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { SettingsGroup } from './SettingsGroup';
import { SettingsItem } from './SettingsItem';
import type { AppSettings } from '@/types/cloud';
import type { ThemeMode } from '@/types/common';

interface SettingsPanelProps {
  settings: AppSettings;
  themeMode: ThemeMode;
  language: AppSettings['language'];
  onThemeModeChange: (mode: ThemeMode) => void;
  onLocaleChange: (
    locale: AppSettings['language'],
  ) => void;
  onSettingsChange: (
    patch: Partial<AppSettings>,
  ) => void;
}

/** 偏好设置面板，按分组展示所有设置项 */
export function SettingsPanel({
  settings,
  themeMode,
  language,
  onThemeModeChange,
  onLocaleChange,
  onSettingsChange,
}: SettingsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl space-y-6">
      {/* 页面标题区 */}
      <div className="mb-2">
        <p className="text-lg font-semibold text-[var(--text)]">
          {t('settings.title')}
        </p>
        <h2 className="text-2xl font-bold text-[var(--text)] mt-1">
          {t('settings.workspacePreferences')}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t('settings.workspacePreferencesDesc')}
        </p>
      </div>
      {/* 外观组 */}
      <SettingsGroup title={t('settings.appearance')}>
        <SettingsItem
          label={t('common.theme')}
          description={t('settings.themeDesc')}
        >
          <Select
            className="w-36"
            value={themeMode}
            onChange={(value) =>
              onThemeModeChange(value as ThemeMode)
            }
            options={[
              {
                value: 'system',
                label: t('settings.system'),
              },
              {
                value: 'light',
                label: t('settings.light'),
              },
              {
                value: 'dark',
                label: t('settings.dark'),
              },
            ]}
          />
        </SettingsItem>

        <SettingsItem
          label={t('common.language')}
          description={t('settings.languageDesc')}
        >
          <Select
            className="w-36"
            value={language}
            onChange={(value) =>
              onLocaleChange(
                value as AppSettings['language'],
              )
            }
            options={[
              {
                value: 'system',
                label: t('settings.system'),
              },
              {
                value: 'zh-CN',
                label: t('settings.chinese'),
              },
              {
                value: 'en-US',
                label: t('settings.english'),
              },
            ]}
          />
        </SettingsItem>
      </SettingsGroup>

      {/* 存储组 */}
      <SettingsGroup title={t('settings.storage')}>
        <SettingsItem
          label={t('settings.https')}
          description={t('settings.httpsDesc')}
        >
          <Checkbox
            checked={settings.https}
            onCheckedChange={(checked) =>
              onSettingsChange({ https: checked })
            }
          />
        </SettingsItem>

        <SettingsItem
          label={t('settings.copyFormat')}
          description={t('settings.copyFormatDesc')}
        >
          <Select
            className="w-36"
            value={settings.copyType}
            onChange={(value) =>
              onSettingsChange({
                copyType: value as 'url' | 'markdown',
              })
            }
            options={[
              { value: 'url', label: 'URL' },
              { value: 'markdown', label: 'Markdown' },
            ]}
          />
        </SettingsItem>

        <SettingsItem
          label={t('settings.paging')}
          description={t('settings.pagingDesc')}
        >
          <Checkbox
            checked={settings.paging}
            onCheckedChange={(checked) =>
              onSettingsChange({ paging: checked })
            }
          />
        </SettingsItem>
      </SettingsGroup>

      {/* 安全组 */}
      <SettingsGroup title={t('settings.security')}>
        <SettingsItem
          label={t('settings.hideDelete')}
          description={t('settings.hideDeleteDesc')}
        >
          <Checkbox
            checked={settings.hideDeleteButton}
            onCheckedChange={(checked) =>
              onSettingsChange({
                hideDeleteButton: checked,
              })
            }
          />
        </SettingsItem>
      </SettingsGroup>

      {/* 关于组 */}
      <SettingsGroup title={t('settings.about')}>
        <SettingsItem label={t('settings.appName')}>
          <span className="text-sm text-[var(--text-secondary)]">
            Cloud Pika
          </span>
        </SettingsItem>
        <SettingsItem label={t('settings.version')}>
          <span className="text-sm text-[var(--text-secondary)]">
            0.1.0
          </span>
        </SettingsItem>
      </SettingsGroup>

    </div>
  );
}
