import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { SettingsGroup } from './SettingsGroup';
import { SettingsItem } from './SettingsItem';
import type { AppSettings } from '@/types/cloud';
import type { ThemeMode } from '@/types/common';

interface SettingsPanelProps {
  settings: AppSettings;
  themeMode: ThemeMode;
  language: AppSettings['language'];
  isSaving?: boolean;
  onThemeModeChange: (mode: ThemeMode) => void;
  onLocaleChange: (
    locale: AppSettings['language'],
  ) => void;
  onSettingsChange: (
    patch: Partial<AppSettings>,
  ) => void;
  onSave: () => void;
}

/** 偏好设置面板，按分组展示所有设置项 */
export function SettingsPanel({
  settings,
  themeMode,
  language,
  isSaving,
  onThemeModeChange,
  onLocaleChange,
  onSettingsChange,
  onSave,
}: SettingsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl space-y-8">
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
          <span className="text-sm text-on-surface-variant">
            Cloud Pika
          </span>
        </SettingsItem>
        <SettingsItem label={t('settings.version')}>
          <span className="text-sm text-on-surface-variant">
            0.1.0
          </span>
        </SettingsItem>
      </SettingsGroup>

      {/* 保存按钮 */}
      <div className="flex justify-end pt-4">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Spinner size="sm" className="mr-2" />
          ) : null}
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
