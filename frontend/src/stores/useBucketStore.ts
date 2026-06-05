import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BucketInfo, ObjectItem } from '@/types/cloud';

/** 每个 bucket 的域名偏好 */
export interface DomainPref {
  domain: string;
  signed: boolean;
}

interface BucketState {
  buckets: BucketInfo[];
  activeBucket: string;
  objects: ObjectItem[];
  marker: string;
  syncStatus: 'idle' | 'syncing';
  /** per-bucket 域名偏好（key = bucket name） */
  domainPrefs: Record<string, DomainPref>;
  reset: () => void;
  setBuckets: (items: BucketInfo[]) => void;
  setActiveBucket: (bucket: string) => void;
  setObjects: (items: ObjectItem[], marker?: string) => void;
  appendObjects: (items: ObjectItem[], marker?: string) => void;
  setSyncStatus: (status: 'idle' | 'syncing') => void;
  setDomainPref: (bucket: string, pref: DomainPref) => void;
}

export const useBucketStore = create<BucketState>()(
  persist(
    (set) => ({
      buckets: [],
      activeBucket: '',
      objects: [],
      marker: '',
      syncStatus: 'idle',
      domainPrefs: {},
      reset: () => set({
        buckets: [], activeBucket: '', objects: [],
        marker: '', syncStatus: 'idle',
      }),
      setBuckets: (buckets) =>
        set((prev) => ({
          buckets,
          activeBucket: buckets.some(
            (item) => item.name === prev.activeBucket,
          )
            ? prev.activeBucket
            : buckets[0]?.name || '',
        })),
      setActiveBucket: (activeBucket) => set({ activeBucket }),
      setObjects: (objects, marker = '') => set({ objects, marker }),
      appendObjects: (items, marker = '') =>
        set((prev) => ({
          objects: [...prev.objects, ...items], marker,
        })),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setDomainPref: (bucket, pref) =>
        set((prev) => ({
          domainPrefs: { ...prev.domainPrefs, [bucket]: pref },
        })),
    }),
    {
      name: 'cloud-pika-bucket',
      partialize: (state) => ({
        domainPrefs: state.domainPrefs,
      }),
    },
  ),
);
