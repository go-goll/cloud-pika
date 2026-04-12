/**
 * useSidecarWatchdog - Sidecar 健康守护 Hook
 * 定期检查 sidecar 进程健康状态，崩溃时自动重启
 */
import { useCallback, useEffect, useRef } from 'react';
import { tauriApi } from '@/lib/tauri';
import { cloudApi, setApiRuntime } from '@/lib/api-client';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from '@/lib/toast';

/** 健康检查间隔（毫秒） */
const CHECK_INTERVAL = 15_000;

/** 连续失败多少次后触发重启 */
const FAIL_THRESHOLD = 2;

export function useSidecarWatchdog(): void {
  const runtime = useAppStore((s) => s.runtime);
  const setRuntime = useAppStore((s) => s.setRuntime);
  const failCountRef = useRef(0);
  const restartingRef = useRef(false);

  const restartSidecar = useCallback(async () => {
    if (restartingRef.current) return;
    restartingRef.current = true;

    try {
      const result = await tauriApi.restartSidecar();
      const newRuntime = {
        sidecarUrl: `http://127.0.0.1:${result.port}`,
        token: result.token,
        ready: true,
      };
      setRuntime(newRuntime);
      setApiRuntime(newRuntime.sidecarUrl, newRuntime.token);
      failCountRef.current = 0;
      toast.success('Sidecar recovered');
    } catch {
      // 重启失败，下次检查会继续尝试
    } finally {
      restartingRef.current = false;
    }
  }, [setRuntime]);

  useEffect(() => {
    if (!runtime.ready || !tauriApi.isTauriEnv()) return;

    const timer = setInterval(async () => {
      try {
        await cloudApi.health();
        failCountRef.current = 0;
      } catch {
        failCountRef.current += 1;
        if (failCountRef.current >= FAIL_THRESHOLD) {
          failCountRef.current = 0;
          void restartSidecar();
        }
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(timer);
  }, [runtime.ready, restartSidecar]);
}
