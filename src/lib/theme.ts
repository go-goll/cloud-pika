import type { ThemeMode } from '@/types/common';

function getMedia(): MediaQueryList | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.matchMedia('(prefers-color-scheme: dark)');
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getMedia()?.matches ? 'dark' : 'light';
  }
  return mode;
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', resolved);
}

export function watchSystemTheme(onChange: () => void): () => void {
  const media = getMedia();
  if (!media) {
    return () => {};
  }
  const listener = () => onChange();
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
