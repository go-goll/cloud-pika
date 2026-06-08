import { describe, expect, it, vi } from 'vitest';
import {
  collectDownloadTargets,
  joinLocalPath,
  parentPrefix,
} from '@/lib/download';

describe('parentPrefix', () => {
  it('根目录返回空前缀', () => {
    expect(parentPrefix('cover/')).toBe('');
  });
  it('嵌套目录返回父前缀', () => {
    expect(parentPrefix('parent/cover/')).toBe('parent/');
  });
});

describe('joinLocalPath', () => {
  it('归一 folder 末尾斜杠', () => {
    expect(joinLocalPath('/Users/a/dl', 'cover/x.png')).toBe(
      '/Users/a/dl/cover/x.png',
    );
    expect(joinLocalPath('/Users/a/dl/', 'cover/x.png')).toBe(
      '/Users/a/dl/cover/x.png',
    );
  });
});

describe('collectDownloadTargets', () => {
  const folder = '/Users/a/dl';

  it('普通文件落到 folder 根，文件名取末段', async () => {
    const list = vi.fn();
    const targets = await collectDownloadTargets(
      ['static/admin_bg.png'],
      folder,
      list,
    );
    expect(list).not.toHaveBeenCalled();
    expect(targets).toEqual([
      { key: 'static/admin_bg.png', localPath: '/Users/a/dl/admin_bg.png' },
    ]);
  });

  it('目录递归展开，保留相对父前缀的层级，跳过目录标记', async () => {
    const list = vi.fn(async (prefix: string) => {
      expect(prefix).toBe('cover/');
      return ['cover/', 'cover/a.png', 'cover/sub/b.png'];
    });
    const targets = await collectDownloadTargets(['cover/'], folder, list);
    expect(targets).toEqual([
      { key: 'cover/a.png', localPath: '/Users/a/dl/cover/a.png' },
      { key: 'cover/sub/b.png', localPath: '/Users/a/dl/cover/sub/b.png' },
    ]);
  });

  it('嵌套目录仅保留所选目录及其内部层级', async () => {
    const list = vi.fn(async () => ['parent/cover/a.png']);
    const targets = await collectDownloadTargets(
      ['parent/cover/'],
      folder,
      list,
    );
    expect(targets).toEqual([
      { key: 'parent/cover/a.png', localPath: '/Users/a/dl/cover/a.png' },
    ]);
  });

  it('混合文件与目录', async () => {
    const list = vi.fn(async () => ['cover/a.png']);
    const targets = await collectDownloadTargets(
      ['logo.png', 'cover/'],
      folder,
      list,
    );
    expect(targets).toEqual([
      { key: 'logo.png', localPath: '/Users/a/dl/logo.png' },
      { key: 'cover/a.png', localPath: '/Users/a/dl/cover/a.png' },
    ]);
  });
});
