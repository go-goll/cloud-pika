import { isImageKey, getExtension } from '@/lib/format';

export type PreviewType = 'image' | 'markdown' | 'code' | 'text';

const CODE_EXTS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'json', 'yaml', 'yml',
  'xml', 'html', 'css', 'scss', 'less', 'go', 'py',
  'rs', 'sh', 'bash', 'zsh', 'toml', 'sql', 'java',
  'kt', 'c', 'cpp', 'h', 'swift', 'rb', 'php',
  'lua', 'dockerfile', 'makefile',
]);

const TEXT_EXTS = new Set(['txt', 'log', 'csv', 'env']);

const LANG_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  go: 'go',
  py: 'python',
  rs: 'rust',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  toml: 'toml',
  sql: 'sql',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  swift: 'swift',
  rb: 'ruby',
  php: 'php',
  lua: 'lua',
  md: 'markdown',
};

/** 根据文件名判断预览类型，不可预览返回 null */
export function getPreviewType(key: string): PreviewType | null {
  if (key.endsWith('/')) return null;
  if (isImageKey(key)) return 'image';
  const ext = getExtension(key);
  if (ext === 'md') return 'markdown';
  if (CODE_EXTS.has(ext)) return 'code';
  if (TEXT_EXTS.has(ext)) return 'text';
  return null;
}

/** 根据文件名返回 Shiki 语言标识符 */
export function getShikiLang(key: string): string {
  const ext = getExtension(key);
  return LANG_MAP[ext] ?? 'text';
}
