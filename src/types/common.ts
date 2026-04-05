export type ThemeMode = 'system' | 'light' | 'dark';

export type I18nLocale = 'zh-CN' | 'en-US';

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
