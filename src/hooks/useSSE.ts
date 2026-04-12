/**
 * useSSE - 服务端推送事件 Hook
 * 监听 sidecar 的 SSE 事件流，自动重连（指数退避）
 */
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTransferStore } from '@/stores/useTransferStore';
import { useBucketStore } from '@/stores/useBucketStore';
import type { TransferTask } from '@/types/cloud';

/** 初始重连延迟（毫秒） */
const BASE_DELAY = 1000;

/** 最大重连延迟（毫秒） */
const MAX_DELAY = 30_000;

export function useSSE(): void {
  const runtime = useAppStore((s) => s.runtime);
  const upsertTransfer = useTransferStore((s) => s.upsertTransfer);
  const setSyncStatus = useBucketStore((s) => s.setSyncStatus);

  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!runtime.ready) return;

    let disposed = false;
    let source: EventSource | null = null;

    const connect = () => {
      if (disposed) return;

      const url =
        `${runtime.sidecarUrl}/api/v1/events`
        + `?token=${encodeURIComponent(runtime.token)}`;
      source = new EventSource(url);

      source.addEventListener('transfer.queued', (event) => {
        const payload = JSON.parse(
          (event as MessageEvent).data,
        ) as { transfer: TransferTask };
        upsertTransfer(payload.transfer);
      });

      source.addEventListener('transfer.progress', (event) => {
        const payload = JSON.parse(
          (event as MessageEvent).data,
        ) as { transfer: TransferTask };
        upsertTransfer(payload.transfer);
      });

      source.addEventListener('transfer.completed', (event) => {
        const payload = JSON.parse(
          (event as MessageEvent).data,
        ) as { transfer: TransferTask };
        upsertTransfer(payload.transfer);
        if (payload.transfer.type === 'upload') {
          window.dispatchEvent(
            new CustomEvent('cloud-pika:upload-completed', {
              detail: payload.transfer,
            }),
          );
        }
      });

      source.addEventListener('transfer.failed', (event) => {
        const payload = JSON.parse(
          (event as MessageEvent).data,
        ) as { transfer: TransferTask };
        upsertTransfer(payload.transfer);
      });

      source.addEventListener('bucket.syncing', (event) => {
        const payload = JSON.parse(
          (event as MessageEvent).data,
        ) as { status: 'start' | 'done' };
        setSyncStatus(
          payload.status === 'start' ? 'syncing' : 'idle',
        );
      });

      source.onopen = () => {
        retriesRef.current = 0;
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (disposed) return;

        // 指数退避重连
        const delay = Math.min(
          BASE_DELAY * 2 ** retriesRef.current,
          MAX_DELAY,
        );
        retriesRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      source?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    runtime.ready, runtime.sidecarUrl, runtime.token,
    setSyncStatus, upsertTransfer,
  ]);
}
