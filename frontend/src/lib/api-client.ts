import {
  AccountService,
  BucketService,
  CDNService,
  GovernanceService,
  ObjectService,
  SettingsService,
  TransferService,
} from '@bindings/services';
import type { ProviderConfig } from '@bindings/internal/model/models';
import type { AccountSummary, AccountUpsertPayload } from '@/types/account';
import type {
  AppSettings,
  BucketInfo,
  CDNQuota,
  CORSRule,
  DownloadParams,
  EncryptionConfig,
  LifecycleRule,
  ListParams,
  ListResult,
  RefererConfig,
  RenameParams,
  SignedURLParams,
  TransferTask,
  UploadParams,
  VersionListResult,
} from '@/types/cloud';

/**
 * setApiRuntime 在 Wails 架构下不再需要 HTTP 地址与令牌，
 * 保留空实现以兼容历史调用方。
 */
export function setApiRuntime(_url: string, _token: string): void {
  // no-op：Wails 进程内调用无需 baseURL/token。
}

/**
 * cloudApi 对外形状保持不变（方法名、签名、返回类型同 @/types），
 * 内部实现由 axios+SSE 改为 Wails service bindings。
 */
export const cloudApi = {
  async listAccounts(): Promise<AccountSummary[]> {
    const accounts = await AccountService.List();
    return accounts as unknown as AccountSummary[];
  },
  async createAccount(payload: AccountUpsertPayload): Promise<AccountSummary> {
    const account = await AccountService.Create(payload as unknown as ProviderConfig);
    return account as unknown as AccountSummary;
  },
  async updateAccount(id: string, payload: AccountUpsertPayload): Promise<AccountSummary> {
    const account = await AccountService.Update(id, payload as unknown as ProviderConfig);
    return account as unknown as AccountSummary;
  },
  async deleteAccount(id: string): Promise<void> {
    await AccountService.Delete(id);
  },
  async getBuckets(provider: string, accountId: string): Promise<BucketInfo[]> {
    const buckets = await BucketService.ListBuckets(provider, accountId);
    return buckets as unknown as BucketInfo[];
  },
  async listObjects(params: ListParams & { accountId: string }): Promise<ListResult> {
    const result = await BucketService.ListObjects(params as unknown as Parameters<typeof BucketService.ListObjects>[0]);
    return result as unknown as ListResult;
  },
  async uploadObject(payload: UploadParams): Promise<{ transferId: string }> {
    return ObjectService.Upload(payload as unknown as Parameters<typeof ObjectService.Upload>[0]);
  },
  async fetchObject(payload: UploadParams): Promise<{ transferId: string }> {
    return ObjectService.Fetch(payload as unknown as Parameters<typeof ObjectService.Fetch>[0]);
  },
  async downloadObject(payload: DownloadParams): Promise<{ transferId: string }> {
    return ObjectService.Download(payload as unknown as Parameters<typeof ObjectService.Download>[0]);
  },
  async renameObject(payload: RenameParams): Promise<void> {
    await ObjectService.Rename(payload as unknown as Parameters<typeof ObjectService.Rename>[0]);
  },
  async createFolder(payload: {
    accountId: string; bucket: string; key: string;
  }): Promise<void> {
    await ObjectService.CreateFolder(payload.accountId, payload.bucket, payload.key);
  },
  async deleteObjects(payload: { accountId: string; bucket: string; keys: string[] }): Promise<void> {
    await ObjectService.Delete(payload.accountId, payload.bucket, payload.keys);
  },
  async generateURL(payload: SignedURLParams): Promise<{ url: string }> {
    return ObjectService.GenerateURL(payload as unknown as Parameters<typeof ObjectService.GenerateURL>[0]);
  },
  async refreshCDN(payload: { accountId: string; urls: string[] }): Promise<void> {
    await CDNService.Refresh(payload.accountId, payload.urls);
  },
  async prefetchCDN(payload: { accountId: string; urls: string[] }): Promise<void> {
    await CDNService.Prefetch(payload.accountId, payload.urls);
  },
  async getCDNQuota(accountId: string): Promise<CDNQuota | null> {
    const quota = await CDNService.Quota(accountId);
    return quota as unknown as CDNQuota | null;
  },
  async listDomains(accountId: string, bucket: string): Promise<string[]> {
    return BucketService.ListDomains(accountId, bucket);
  },
  async listTransfers(): Promise<TransferTask[]> {
    const transfers = await TransferService.List();
    return transfers as unknown as TransferTask[];
  },
  async cancelTransfer(id: string): Promise<void> {
    await TransferService.Cancel(id);
  },
  async getSettings(): Promise<AppSettings> {
    const settings = await SettingsService.Get();
    return settings as unknown as AppSettings;
  },
  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    const updated = await SettingsService.Update(
      settings as unknown as Parameters<typeof SettingsService.Update>[0],
    );
    return updated as unknown as AppSettings;
  },
  async getProviderFeatures(accountId: string): Promise<string[]> {
    return SettingsService.ProviderFeatures(accountId);
  },

  // ---- Bucket 治理 API ----

  async getLifecycle(accountId: string, bucket: string): Promise<LifecycleRule[]> {
    const rules = await GovernanceService.GetLifecycle(accountId, bucket);
    return (rules ?? []) as unknown as LifecycleRule[];
  },
  async putLifecycle(
    payload: { accountId: string; bucket: string; rules: LifecycleRule[] },
  ): Promise<void> {
    await GovernanceService.PutLifecycle(
      payload as unknown as Parameters<typeof GovernanceService.PutLifecycle>[0],
    );
  },
  async deleteLifecycle(
    payload: { accountId: string; bucket: string },
  ): Promise<void> {
    await GovernanceService.DeleteLifecycle(payload.accountId, payload.bucket);
  },

  async getCORS(accountId: string, bucket: string): Promise<CORSRule[]> {
    const rules = await GovernanceService.GetCORS(accountId, bucket);
    return (rules ?? []) as unknown as CORSRule[];
  },
  async putCORS(
    payload: { accountId: string; bucket: string; rules: CORSRule[] },
  ): Promise<void> {
    await GovernanceService.PutCORS(
      payload as unknown as Parameters<typeof GovernanceService.PutCORS>[0],
    );
  },

  async getReferer(accountId: string, bucket: string): Promise<RefererConfig> {
    const config = await GovernanceService.GetReferer(accountId, bucket);
    return config as unknown as RefererConfig;
  },
  async putReferer(
    payload: { accountId: string; bucket: string; config: RefererConfig },
  ): Promise<void> {
    await GovernanceService.PutReferer(
      payload as unknown as Parameters<typeof GovernanceService.PutReferer>[0],
    );
  },

  async getEncryption(accountId: string, bucket: string): Promise<EncryptionConfig> {
    const config = await GovernanceService.GetEncryption(accountId, bucket);
    return config as unknown as EncryptionConfig;
  },
  async putEncryption(
    payload: { accountId: string; bucket: string; config: EncryptionConfig },
  ): Promise<void> {
    await GovernanceService.PutEncryption(
      payload as unknown as Parameters<typeof GovernanceService.PutEncryption>[0],
    );
  },

  async getVersioning(accountId: string, bucket: string): Promise<string> {
    const status = await GovernanceService.GetVersioning(accountId, bucket);
    return status || 'Suspended';
  },
  async putVersioning(
    payload: { accountId: string; bucket: string; status: string },
  ): Promise<void> {
    await GovernanceService.PutVersioning(payload.accountId, payload.bucket, payload.status);
  },
  async listObjectVersions(params: {
    accountId: string; bucket: string; prefix?: string;
    keyMarker?: string; versionMarker?: string; limit?: number;
  }): Promise<VersionListResult> {
    const result = await GovernanceService.ListObjectVersions(
      params as unknown as Parameters<typeof GovernanceService.ListObjectVersions>[0],
    );
    return result as unknown as VersionListResult;
  },
};
