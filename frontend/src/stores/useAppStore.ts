import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { I18nLocale, ThemeMode } from '@/types/common';
import type { AppSettings } from '@/types/cloud';
import { resolveSystemLocale } from '@/lib/locale';

interface RuntimeState {
  sidecarUrl: string;
  token: string;
  ready: boolean;
}

interface AppState {
  locale: I18nLocale;
  themeMode: ThemeMode;
  settings: AppSettings;
  runtime: RuntimeState;
  setLocale: (locale: I18nLocale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setRuntime: (runtime: RuntimeState) => void;
  setSettings: (settings: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  language: 'system',
  theme: 'system',
  https: true,
  hideDeleteButton: false,
  paging: false,
  copyType: 'url',
  autoRefreshCDN: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: resolveSystemLocale(),
      themeMode: 'system',
      settings: defaultSettings,
      runtime: {
        sidecarUrl: '',
        token: '',
        ready: false,
      },
      setLocale: (locale) => set({ locale }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setRuntime: (runtime) => set({ runtime }),
      setSettings: (settings) => set({ settings }),
    }),
    {
      name: 'cloud-pika-app',
      partialize: (state) => ({
        locale: state.locale,
        themeMode: state.themeMode,
      }),
    },
  ),
);
