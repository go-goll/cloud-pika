import type { ObjectItem } from '@/types/cloud';

export type StatusTone = 'good' | 'warn' | 'neutral';

export interface ObjectStatus {
  labelKey: string;
  tone: StatusTone;
}

/**
 * 推导对象状态胶囊。当前对象元数据仅含目录/大小/时间，
 * 因此只做诚实的可得态：目录=Folder，文件=Ready。
 */
export function getObjectStatus(item: ObjectItem): ObjectStatus {
  if (item.isDir || item.key.endsWith('/')) {
    return { labelKey: 'status.folder', tone: 'neutral' };
  }
  return { labelKey: 'status.ready', tone: 'good' };
}
