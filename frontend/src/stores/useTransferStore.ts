import { create } from 'zustand';
import type { TransferTask } from '@/types/cloud';

interface TransferState {
  transfers: TransferTask[];
  setTransfers: (transfers: TransferTask[]) => void;
  upsertTransfer: (transfer: TransferTask) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: [],
  setTransfers: (transfers) => set({ transfers }),
  upsertTransfer: (transfer) =>
    set((prev) => {
      const idx = prev.transfers.findIndex((item) => item.id === transfer.id);
      if (idx < 0) {
        return { transfers: [transfer, ...prev.transfers] };
      }
      const next = [...prev.transfers];
      next[idx] = transfer;
      return { transfers: next };
    }),
}));
