/**
 * 下载目标展开工具。
 * 解决"选择目录下载失败"问题：目录（以 / 结尾）本身不是可下载对象，
 * 需递归列举其前缀下的全部对象，逐个下载并保留相对层级。
 */

/** 单个下载目标：远端对象 key 与本地落盘路径。 */
export interface DownloadTarget {
  key: string;
  localPath: string;
}

/** 目录 key 的父前缀，用于计算本地相对路径。'a/b/' -> 'a/'；'b/' -> ''。 */
export function parentPrefix(dirKey: string): string {
  const trimmed = dirKey.endsWith('/') ? dirKey.slice(0, -1) : dirKey;
  const idx = trimmed.lastIndexOf('/');
  return idx === -1 ? '' : trimmed.slice(0, idx + 1);
}

/** 拼接本地路径，归一 folder 末尾斜杠。 */
export function joinLocalPath(folder: string, relative: string): string {
  const base = folder.endsWith('/') ? folder.slice(0, -1) : folder;
  return `${base}/${relative}`;
}

/**
 * 将选中的 key 列表展开为待下载目标。
 * - 普通文件：落到 folder 根，文件名取末段。
 * - 目录（以 / 结尾）：调用 listRecursive 递归列举其对象，
 *   按相对父前缀的路径保留层级，跳过目录标记对象。
 * listRecursive 负责递归列举某前缀下的全部对象 key（已分页合并）。
 */
export async function collectDownloadTargets(
  keys: string[],
  folder: string,
  listRecursive: (prefix: string) => Promise<string[]>,
): Promise<DownloadTarget[]> {
  const targets: DownloadTarget[] = [];
  for (const key of keys) {
    if (!key.endsWith('/')) {
      const fileName = key.split('/').pop() || key;
      targets.push({ key, localPath: joinLocalPath(folder, fileName) });
      continue;
    }
    const base = parentPrefix(key);
    const objectKeys = await listRecursive(key);
    for (const objKey of objectKeys) {
      if (objKey.endsWith('/')) continue; // 跳过目录标记
      const relative = objKey.startsWith(base)
        ? objKey.slice(base.length)
        : objKey;
      targets.push({ key: objKey, localPath: joinLocalPath(folder, relative) });
    }
  }
  return targets;
}
