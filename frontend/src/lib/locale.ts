import type { I18nLocale } from '@/types/common';

export function resolveSystemLocale(): I18nLocale {
  if (typeof navigator === 'undefined') {
    return 'en-US';
  }
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
}

export function normalizeLocale(input: string): I18nLocale {
  if (input === 'zh-CN' || input === 'en-US') {
    return input;
  }
  return resolveSystemLocale();
}
