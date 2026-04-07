/**
 * 文件大小和时间格式化工具函数
 */

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 将字节数格式化为可读的文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    SIZE_UNITS.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  const formatted = exponent === 0
    ? value.toString()
    : value.toFixed(1).replace(/\.0$/, '');
  return `${formatted} ${SIZE_UNITS[exponent]}`;
}

/** 将ISO时间字符串格式化为相对时间描述 */
export function formatRelativeTime(
  dateStr: string,
  locale = 'zh-CN',
): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isZh = locale.startsWith('zh');

  if (diffSec < 60) {
    return isZh ? '刚刚' : 'Just now';
  }
  if (diffMin < 60) {
    return isZh
      ? `${diffMin} 分钟前`
      : `${diffMin}m ago`;
  }
  if (diffHour < 24) {
    return isZh
      ? `${diffHour} 小时前`
      : `${diffHour}h ago`;
  }
  if (diffDay < 30) {
    return isZh
      ? `${diffDay} 天前`
      : `${diffDay}d ago`;
  }

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
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
