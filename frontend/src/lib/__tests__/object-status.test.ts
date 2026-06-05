import { describe, expect, it } from 'vitest';
import { getObjectStatus } from '@/lib/object-status';

describe('getObjectStatus', () => {
  it('目录返回 folder/neutral', () => {
    const status = getObjectStatus({
      key: 'a/',
      size: 0,
      isDir: true,
    });
    expect(status).toEqual({
      labelKey: 'status.folder',
      tone: 'neutral',
    });
  });

  it('以斜杠结尾视为目录', () => {
    expect(getObjectStatus({ key: 'a/', size: 0 }).labelKey).toBe(
      'status.folder',
    );
  });

  it('普通文件返回 ready/good', () => {
    const status = getObjectStatus({ key: 'a.png', size: 1 });
    expect(status).toEqual({
      labelKey: 'status.ready',
      tone: 'good',
    });
  });
});
