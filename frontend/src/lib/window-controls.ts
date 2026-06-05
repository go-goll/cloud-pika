import { Window } from '@wailsio/runtime';

/**
 * Windows 自绘标题栏的窗口控件适配层。
 * Wails v3 alpha 的方法命名若与实机不符，只需在此单文件调整。
 */
export const windowControls = {
  minimise: () => {
    void Window.Minimise?.();
  },
  toggleMaximise: () => {
    void Window.ToggleMaximise?.();
  },
  close: () => {
    void Window.Close?.();
  },
};
