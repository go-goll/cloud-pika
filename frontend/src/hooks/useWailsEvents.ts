/**
 * useWailsEvents - Wails 进程内事件订阅 Hook
 * 替代原 SSE：监听后端 transfer.* 与 bucket.syncing 事件，
 * 更新传输与桶同步状态。进程内事件无断线，无需重连。
 */
import { useEffect } from 'react';
import { Events } from '@wailsio/runtime';
import { useTransferStore } from '@/stores/useTransferStore';
import { useBucketStore } from '@/stores/useBucketStore';
import type { TransferTask } from '@/types/cloud';

/** 传输事件载荷：{ transfer: TransferTask } */
interface TransferEventData {
  transfer: TransferTask;
}

/** 桶同步事件载荷 */
interface BucketSyncData {
  provider: string;
  accountId: string;
  status: 'start' | 'done';
  count?: number;
}

export function useWailsEvents(): void {
  const upsertTransfer = useTransferStore((s) => s.upsertTransfer);
  const setSyncStatus = useBucketStore((s) => s.setSyncStatus);

  useEffect(() => {
    const handleTransfer = (e: { data: TransferEventData }) => {
      const { transfer } = e.data;
      if (!transfer) return;
      upsertTransfer(transfer);
      if (transfer.status === 'completed' && transfer.type === 'upload') {
        window.dispatchEvent(
          new CustomEvent('cloud-pika:upload-completed', { detail: transfer }),
        );
      }
    };

    const offs = [
      Events.On('transfer.queued', handleTransfer),
      Events.On('transfer.progress', handleTransfer),
      Events.On('transfer.completed', handleTransfer),
      Events.On('transfer.failed', handleTransfer),
      Events.On('bucket.syncing', (e: { data: BucketSyncData }) => {
        setSyncStatus(e.data.status === 'start' ? 'syncing' : 'idle');
      }),
    ];

    return () => {
      offs.forEach((off) => off());
    };
  }, [setSyncStatus, upsertTransfer]);
}
