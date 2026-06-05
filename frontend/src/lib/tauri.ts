import { SystemService } from '@bindings/services';

/**
 * tauriApi 保留对外形状，内部实现由 Tauri invoke 改为 Wails SystemService。
 * isTauriEnv 恒返回 true（始终运行于桌面环境），以兼容历史调用方。
 */
export const tauriApi = {
  isTauriEnv(): boolean {
    return true;
  },
  openFileDialog(): Promise<string[]> {
    return SystemService.OpenFileDialog();
  },
  openFolderDialog(): Promise<string[]> {
    return SystemService.OpenFolderDialog();
  },
  readClipboardImage(): Promise<string> {
    return SystemService.ReadClipboardImage();
  },
  writeClipboardText(text: string): Promise<void> {
    return SystemService.WriteClipboardText(text);
  },
  trayUploadSelect(): Promise<string[]> {
    return SystemService.OpenFileDialog();
  },
};
