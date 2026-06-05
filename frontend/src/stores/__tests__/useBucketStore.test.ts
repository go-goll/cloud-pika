import { beforeEach, describe, expect, it } from 'vitest';
import { useBucketStore } from '@/stores/useBucketStore';

describe('useBucketStore selection', () => {
  beforeEach(() => {
    useBucketStore.getState().setSelectedKeys(new Set());
  });

  it('setSelectedKeys 覆盖选中', () => {
    useBucketStore.getState().setSelectedKeys(new Set(['a', 'b']));
    expect(useBucketStore.getState().selectedKeys.size).toBe(2);
  });

  it('clearSelection 清空', () => {
    useBucketStore.getState().setSelectedKeys(new Set(['a']));
    useBucketStore.getState().clearSelection();
    expect(useBucketStore.getState().selectedKeys.size).toBe(0);
  });
});
