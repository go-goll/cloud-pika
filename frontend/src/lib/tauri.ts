export interface SidecarStartResponse {
  port: number;
  token: string;
  pid: number;
}

export interface HealthResponse {
  status: string;
}

const isTauriEnv = () => '__TAURI_INTERNALS__' in window;

async function invoke<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!isTauriEnv()) {
    throw new Error('当前不在 Tauri 环境中');
  }
  const mod = await import('@tauri-apps/api/core');
  return mod.invoke<T>(cmd, args);
}

export const tauriApi = {
  isTauriEnv,
  startSidecar(): Promise<SidecarStartResponse> {
    return invoke<SidecarStartResponse>('start_sidecar');
  },
  restartSidecar(): Promise<SidecarStartResponse> {
    return invoke<SidecarStartResponse>('restart_sidecar');
  },
  sidecarHealth(): Promise<HealthResponse> {
    return invoke<HealthResponse>('get_sidecar_health');
  },
  openFileDialog(): Promise<string[]> {
    return invoke<string[]>('open_file_dialog');
  },
  openFolderDialog(): Promise<string[]> {
    return invoke<string[]>('open_folder_dialog');
  },
  readClipboardImage(): Promise<string> {
    return invoke<string>('read_clipboard_image');
  },
  writeClipboardText(text: string): Promise<void> {
    return invoke<void>('write_clipboard_text', { text });
  },
  trayUploadSelect(): Promise<string[]> {
    return invoke<string[]>('tray_upload_select');
  },
};
