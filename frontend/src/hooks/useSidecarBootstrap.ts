import { useEffect, useState } from 'react';
import { tauriApi } from '@/lib/tauri';
import { cloudApi, setApiRuntime } from '@/lib/api-client';
import { useAppStore } from '@/stores/useAppStore';
import i18n from 'i18next';
import { normalizeLocale } from '@/lib/locale';

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
        if (!tauriApi.isTauriEnv()) {
          const fallback = {
            sidecarUrl: 'http://127.0.0.1:8787',
            token: 'dev-token',
            ready: true,
          };
          setRuntime(fallback);
          setApiRuntime(fallback.sidecarUrl, fallback.token);
          try {
            const settings = await cloudApi.getSettings();
            if (active) {
              setSettings(settings);

              const resolvedLocale = normalizeLocale(settings.language);
              setLocale(resolvedLocale);
              void i18n.changeLanguage(resolvedLocale);

              setThemeMode(settings.theme);
            }
          } catch {
            // Keep app bootstrapped with local defaults if settings endpoint is unavailable.
          }
          return;
        }

        const result = await tauriApi.startSidecar();
        const runtime = {
          sidecarUrl: `http://127.0.0.1:${result.port}`,
          token: result.token,
          ready: true,
        };
        setRuntime(runtime);
        setApiRuntime(runtime.sidecarUrl, runtime.token);

        try {
          const settings = await cloudApi.getSettings();
          if (active) {
            setSettings(settings);

            const resolvedLocale = normalizeLocale(settings.language);
            setLocale(resolvedLocale);
            void i18n.changeLanguage(resolvedLocale);

            setThemeMode(settings.theme);
          }
        } catch {
          // Keep app bootstrapped with local defaults if settings endpoint is unavailable.
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '启动 sidecar 失败';
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
