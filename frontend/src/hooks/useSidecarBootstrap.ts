import { useEffect, useState } from 'react';
import { cloudApi } from '@/lib/api-client';
import { useAppStore } from '@/stores/useAppStore';
import i18n from 'i18next';
import { normalizeLocale } from '@/lib/locale';

/**
 * useSidecarBootstrap 在 Wails 架构下不再启动 sidecar，
 * 仅初始化 runtime 标记并加载应用设置（语言/主题）。
 * 保留返回结构与名称以兼容调用方。
 */
export function useSidecarBootstrap(): { loading: boolean; error: string } {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const setRuntime = useAppStore((s) => s.setRuntime);
  const setSettings = useAppStore((s) => s.setSettings);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const setLocale = useAppStore((s) => s.setLocale);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        setRuntime({ sidecarUrl: '', token: '', ready: true });

        const settings = await cloudApi.getSettings();
        if (active) {
          setSettings(settings);

          const resolvedLocale = normalizeLocale(settings.language);
          setLocale(resolvedLocale);
          void i18n.changeLanguage(resolvedLocale);

          setThemeMode(settings.theme);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '加载应用设置失败';
        if (active) {
          setError(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, [setLocale, setRuntime, setSettings, setThemeMode]);

  return { loading, error };
}
