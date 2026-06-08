import { describe, expect, it } from 'vitest';
import { deriveMetrics } from '@/lib/metrics';

describe('deriveMetrics', () => {
  it('对象数取已加载数、队列取活跃任务数', () => {
    const metrics = deriveMetrics({ objectsLoaded: 30, activeTransfers: 2 });
    expect(metrics.objects).toBe('30');
    expect(metrics.queue).toBe('2');
  });

  it('无数据时降级为 0', () => {
    const metrics = deriveMetrics({ objectsLoaded: 0, activeTransfers: 0 });
    expect(metrics.objects).toBe('0');
    expect(metrics.queue).toBe('0');
  });
});
