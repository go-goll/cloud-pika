export type Platform = 'mac' | 'win' | 'other';

/** 基于 userAgent 检测运行平台，用于标题栏控件分支。 */
export function detectPlatform(
  ua: string = typeof navigator !== 'undefined'
    ? navigator.userAgent
    : '',
): Platform {
  if (/Mac|iPhone|iPad|iPod/.test(ua)) return 'mac';
  if (/Win/.test(ua)) return 'win';
  return 'other';
}
