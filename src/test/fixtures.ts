import type { ObjectItem, TransferTask, BucketInfo } from '@/types/cloud';
import type { AccountSummary } from '@/types/account';

export function createObjectItem(
  overrides: Partial<ObjectItem> = {},
): ObjectItem {
  return {
    key: 'test-file.txt',
    size: 1024,
    mimeType: 'text/plain',
    lastModified: '2026-04-01T12:00:00Z',
    ...overrides,
  };
}

export function createTransferTask(
  overrides: Partial<TransferTask> = {},
): TransferTask {
  return {
    id: 'transfer-1',
    type: 'upload',
    bucket: 'my-bucket',
    key: 'test-file.txt',
    status: 'running',
    progress: 50,
    createdAt: '2026-04-01T12:00:00Z',
    updatedAt: '2026-04-01T12:01:00Z',
    ...overrides,
  };
}

export function createBucketInfo(
  overrides: Partial<BucketInfo> = {},
): BucketInfo {
  return {
    name: 'my-bucket',
    provider: 'qiniu',
    ...overrides,
  };
}

export function createAccountSummary(
  overrides: Partial<AccountSummary> = {},
): AccountSummary {
  return {
    id: 'account-1',
    provider: 'qiniu',
    name: 'Test Account',
    accessKey: 'ak-test',
    internal: false,
    paging: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
