import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileText,
  FileVideo,
  Folder,
  Image,
} from 'lucide-react';
import { isImageKey, getExtension } from '@/lib/format';

const ARCHIVE_EXTS = new Set(['zip', 'tar', 'gz', 'rar', '7z']);
const CODE_EXTS = new Set([
  'js', 'ts', 'jsx', 'tsx', 'json',
  'yml', 'yaml', 'xml', 'html', 'css',
]);

/** 根据文件名和 mimeType 返回对应的 Lucide 图标 */
export function getFileIcon(key: string, mimeType?: string, size = 28) {
  if (key.endsWith('/')) {
    return <Folder size={size} className="icon-folder" />;
  }
  if (isImageKey(key) || mimeType?.startsWith('image/')) {
    return <Image size={size} className="icon-image" />;
  }
  if (mimeType?.startsWith('video/')) {
    return <FileVideo size={size} className="icon-video" />;
  }
  if (mimeType?.startsWith('audio/')) {
    return <FileAudio size={size} className="icon-audio" />;
  }
  if (mimeType?.startsWith('text/')) {
    return <FileText size={size} className="icon-text" />;
  }
  const ext = getExtension(key);
  if (ARCHIVE_EXTS.has(ext)) {
    return <FileArchive size={size} className="icon-archive" />;
  }
  if (CODE_EXTS.has(ext)) {
    return <FileCode size={size} className="icon-code" />;
  }
  return <File size={size} className="icon-file" />;
}

/** 文件类型对应的图标容器底色语义类（颜色集中在 index.css 的 icon-bg-* 令牌） */
export function getIconBg(key: string, mimeType?: string): string {
  if (key.endsWith('/')) return 'icon-bg-folder';
  if (isImageKey(key) || mimeType?.startsWith('image/')) return 'icon-bg-image';
  if (mimeType?.startsWith('video/')) return 'icon-bg-video';
  if (mimeType?.startsWith('audio/')) return 'icon-bg-audio';
  if (mimeType?.startsWith('text/')) return 'icon-bg-text';
  const ext = getExtension(key);
  if (ARCHIVE_EXTS.has(ext)) return 'icon-bg-archive';
  if (CODE_EXTS.has(ext)) return 'icon-bg-code';
  return 'icon-bg-file';
}
