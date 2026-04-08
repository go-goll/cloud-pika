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
  onLocaleChange: (locale: AppSettings['language']) => void;
  onSettingsChange: (patch: Partial<AppSettings>) => void;
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
    <div className="max-w-2xl space-y-6">
      {/* 外观组 */}
      <SettingsGroup title={t('settings.appearance')}>
        <SettingsItem
          label={t('common.theme')}
          description={t('settings.themeDesc')}
        >
          <Select
            className="w-36"
            value={themeMode}
            onChange={(e) =>
              onThemeModeChange(e.target.value as ThemeMode)
            }
          >
            <option value="system">
              {t('settings.system')}
            </option>
            <option value="light">
              {t('settings.light')}
            </option>
            <option value="dark">
              {t('settings.dark')}
            </option>
          </Select>
        </SettingsItem>

        <SettingsItem
          label={t('common.language')}
          description={t('settings.languageDesc')}
        >
          <Select
            className="w-36"
            value={language}
            onChange={(e) =>
              onLocaleChange(
                e.target.value as AppSettings['language'],
              )
            }
          >
            <option value="system">
              {t('settings.system')}
            </option>
            <option value="zh-CN">
              {t('settings.chinese')}
            </option>
            <option value="en-US">
              {t('settings.english')}
            </option>
          </Select>
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
            onChange={(e) =>
              onSettingsChange({ https: e.target.checked })
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
            onChange={(e) =>
              onSettingsChange({
                copyType: e.target.value as
                  | 'url'
                  | 'markdown',
              })
            }
          >
            <option value="url">URL</option>
            <option value="markdown">Markdown</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          label={t('settings.paging')}
          description={t('settings.pagingDesc')}
        >
          <Checkbox
            checked={settings.paging}
            onChange={(e) =>
              onSettingsChange({ paging: e.target.checked })
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
            onChange={(e) =>
              onSettingsChange({
                hideDeleteButton: e.target.checked,
              })
            }
          />
        </SettingsItem>
      </SettingsGroup>

      {/* 关于组 */}
      <SettingsGroup title={t('settings.about')}>
        <SettingsItem label={t('settings.appName')}>
          <span className="text-sm text-[var(--text-muted)]">
            Cloud Pika
          </span>
        </SettingsItem>
        <SettingsItem label={t('settings.version')}>
          <span className="text-sm text-[var(--text-muted)]">
            0.1.0
          </span>
        </SettingsItem>
      </SettingsGroup>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Spinner size={16} className="mr-2" />
          ) : null}
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
