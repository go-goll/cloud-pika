import type { BucketInfo } from '@/types/cloud';
import { formatFileSize } from '@/lib/format';

export interface MetricsInput {
  bucket?: BucketInfo;
  objectsLoaded: number;
  activeTransfers: number;
  hasCDN: boolean;
}

export interface MetricsView {
  objects: string;
  storage: string;
  cdn: string;
  queue: string;
}

/** 计算四指标展示值，缺失数据一律降级为 "—"。 */
export function deriveMetrics(input: MetricsInput): MetricsView {
  const {
    bucket,
    objectsLoaded,
    activeTransfers,
    hasCDN,
  } = input;
  return {
    objects: String(bucket?.count ?? objectsLoaded),
    storage: bucket?.space != null ? formatFileSize(bucket.space) : '—',
    cdn: hasCDN ? 'Healthy' : '—',
    queue: String(activeTransfers),
  };
}
