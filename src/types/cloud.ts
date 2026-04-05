import type { ProviderKey } from './account';

export interface BucketInfo {
  name: string;
  location?: string;
  provider: ProviderKey;
  permission?: number;
  count?: number;
  space?: number;
}

export interface ObjectItem {
  key: string;
  size: number;
  mimeType?: string;
  etag?: string;
  lastModified?: string;
  isDir?: boolean;
}

export interface ListParams {
  bucket: string;
  prefix?: string;
  marker?: string;
  limit?: number;
  delimiter?: string;
}

export interface ListResult {
  items: ObjectItem[];
  marker?: string;
  truncated: boolean;
}

export interface UploadParams {
  accountId: string;
  bucket: string;
  key: string;
  localPath?: string;
  sourceUrl?: string;
  overwrite?: boolean;
}

export interface RenameParams {
  accountId: string;
  bucket: string;
  from: string;
  to: string;
}

export interface DownloadParams {
  accountId: string;
  bucket: string;
  key: string;
  localPath: string;
}

export interface SignedURLParams {
  accountId: string;
  bucket: string;
  key: string;
  domain?: string;
  deadlineSeconds?: number;
  https?: boolean;
}

export type TransferStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface TransferTask {
  id: string;
  type: 'upload' | 'download' | 'fetch';
  bucket: string;
  key: string;
  status: TransferStatus;
  progress: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  language: 'system' | 'zh-CN' | 'en-US';
  theme: 'system' | 'light' | 'dark';
  https: boolean;
  hideDeleteButton: boolean;
  paging: boolean;
  copyType: 'url' | 'markdown';
}
