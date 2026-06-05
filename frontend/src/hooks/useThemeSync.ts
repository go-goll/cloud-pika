import { useEffect } from 'react';
import { applyTheme, watchSystemTheme } from '@/lib/theme';
import { useAppStore } from '@/stores/useAppStore';

export function useThemeSync(): void {
  const mode = useAppStore((s) => s.themeMode);

  useEffect(() => {
    applyTheme(mode);
    return watchSystemTheme(() => applyTheme(mode));
  }, [mode]);
}
