import { create } from 'zustand';
import type { BucketInfo, ObjectItem } from '@/types/cloud';

interface BucketState {
  buckets: BucketInfo[];
  activeBucket: string;
  objects: ObjectItem[];
  marker: string;
  syncStatus: 'idle' | 'syncing';
  setBuckets: (items: BucketInfo[]) => void;
  setActiveBucket: (bucket: string) => void;
  setObjects: (items: ObjectItem[], marker?: string) => void;
  appendObjects: (items: ObjectItem[], marker?: string) => void;
  setSyncStatus: (status: 'idle' | 'syncing') => void;
}

export const useBucketStore = create<BucketState>((set) => ({
  buckets: [],
  activeBucket: '',
  objects: [],
  marker: '',
  syncStatus: 'idle',
  setBuckets: (buckets) =>
    set((prev) => ({
      buckets,
      activeBucket: prev.activeBucket || buckets[0]?.name || '',
    })),
  setActiveBucket: (activeBucket) => set({ activeBucket }),
  setObjects: (objects, marker = '') => set({ objects, marker }),
  appendObjects: (items, marker = '') =>
    set((prev) => ({ objects: [...prev.objects, ...items], marker })),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
}));
