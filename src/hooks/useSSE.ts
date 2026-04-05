import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTransferStore } from '@/stores/useTransferStore';
import { useBucketStore } from '@/stores/useBucketStore';
import type { TransferTask } from '@/types/cloud';

export function useSSE(): void {
  const runtime = useAppStore((s) => s.runtime);
  const upsertTransfer = useTransferStore((s) => s.upsertTransfer);
  const setSyncStatus = useBucketStore((s) => s.setSyncStatus);

  useEffect(() => {
    if (!runtime.ready) {
      return;
    }

    const url = `${runtime.sidecarUrl}/api/v1/events?token=${encodeURIComponent(runtime.token)}`;
    const source = new EventSource(url);

    source.addEventListener('transfer.queued', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { transfer: TransferTask };
      upsertTransfer(payload.transfer);
    });

    source.addEventListener('transfer.progress', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { transfer: TransferTask };
      upsertTransfer(payload.transfer);
    });

    source.addEventListener('transfer.completed', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { transfer: TransferTask };
      upsertTransfer(payload.transfer);
    });

    source.addEventListener('transfer.failed', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { transfer: TransferTask };
      upsertTransfer(payload.transfer);
    });

    source.addEventListener('bucket.syncing', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { status: 'start' | 'done' };
      setSyncStatus(payload.status === 'start' ? 'syncing' : 'idle');
    });

    return () => {
      source.close();
    };
  }, [runtime.ready, runtime.sidecarUrl, runtime.token, setSyncStatus, upsertTransfer]);
}
