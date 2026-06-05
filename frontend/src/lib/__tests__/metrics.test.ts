import { describe, expect, it } from 'vitest';
import { deriveMetrics } from '@/lib/metrics';

describe('deriveMetrics', () => {
  it('优先用 bucket 统计，缺失降级 —', () => {
    const metrics = deriveMetrics({
      bucket: {
        name: 'b',
        provider: 'qiniu',
        count: 100,
        space: 2048,
      },
      objectsLoaded: 30,
      activeTransfers: 2,
      hasCDN: true,
    });
    expect(metrics.objects).toBe('100');
    expect(metrics.storage).not.toBe('—');
    expect(metrics.cdn).toBe('Healthy');
    expect(metrics.queue).toBe('2');
  });

  it('无 bucket 统计时对象回退已加载数、存储/CDN 降级', () => {
    const metrics = deriveMetrics({
      bucket: { name: 'b', provider: 'qiniu' },
      objectsLoaded: 30,
      activeTransfers: 0,
      hasCDN: false,
    });
    expect(metrics.objects).toBe('30');
    expect(metrics.storage).toBe('—');
    expect(metrics.cdn).toBe('—');
    expect(metrics.queue).toBe('0');
  });
});
