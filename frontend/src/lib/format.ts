import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

/** 文件大小单位定义 */
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * 将字节数转为人类可读的文件大小格式
 * 例如：1024 -> "1 KB"，1048576 -> "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    SIZE_UNITS.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  const formatted = exponent === 0
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, '');

  return `${formatted} ${SIZE_UNITS[exponent]}`;
}

/** 获取当前语言环境对应的 date-fns locale */
function getDateLocale() {
  const lang = navigator.language.toLowerCase();
  return lang.startsWith('zh') ? zhCN : enUS;
}

/**
 * 将 ISO 日期字符串转为本地化格式
 * 例如："2024-01-15T14:30:00Z" -> "2024-01-15 14:30"
 */
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'yyyy-MM-dd HH:mm');
  } catch {
    return date;
  }
}

/**
 * 将 ISO 日期字符串转为相对时间描述
 * 例如："3分钟前" 或 "3 minutes ago"
 */
export function formatRelativeTime(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), {
      addSuffix: true,
      locale: getDateLocale(),
    });
  } catch {
    return date;
  }
}

/**
 * 根据文件key判断是否为图片类型
 * 通过扩展名推断
 */
export function isImageKey(key: string): boolean {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return [
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'svg', 'bmp', 'ico', 'avif',
  ].includes(ext);
}

/**
 * 根据 copyType 格式化 URL
 * url 模式返回纯 URL，markdown 模式返回 markdown 链接
 */
export function formatCopyUrl(
  url: string,
  key: string,
  copyType: 'url' | 'markdown',
): string {
  if (copyType !== 'markdown') return url;
  const name = extractFileName(key);
  return isImageKey(key) ? `![${name}](${url})` : `[${name}](${url})`;
}

/**
 * 格式化传输速度
 * 例如：1048576 -> "1 MB/s"
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

/**
 * 格式化预计剩余时间
 * 返回如 "2m 30s"、"1h 5m"，speed 为 0 时返回 "--"
 */
export function formatETA(remainingBytes: number, speed: number): string {
  if (speed <= 0) return '--';
  const totalSeconds = Math.ceil(remainingBytes / speed);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}h ${remainMinutes}m`;
}

/** 提取文件扩展名（小写） */
export function getExtension(key: string): string {
  return key.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * 从完整key中提取文件名
 * 例如 "images/2024/photo.jpg" -> "photo.jpg"
 */
export function extractFileName(key: string): string {
  if (key.endsWith('/')) {
    const parts = key.slice(0, -1).split('/');
    return parts[parts.length - 1] + '/';
  }
  return key.split('/').pop() ?? key;
}
