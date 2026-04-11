import axios from 'axios';
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
} from '@/types/cloud';

let baseUrl = '';
let accessToken = '';

const client = axios.create({
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  config.baseURL = baseUrl;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error?.response?.data as
      | { error?: string; message?: string; detail?: string; provider?: string; stage?: string }
      | undefined;
    if (payload) {
      const detail = payload.detail?.trim();
      const baseMessage = payload.message?.trim() || payload.error?.trim();
      const providerStage =
        payload.provider && payload.stage ? ` (${payload.provider}/${payload.stage})` : '';
      if (baseMessage) {
        error.message = detail ? `${baseMessage}${providerStage}: ${detail}` : `${baseMessage}${providerStage}`;
      }
    }
    return Promise.reject(error);
  },
);

export function setApiRuntime(url: string, token: string): void {
  baseUrl = url;
  accessToken = token;
}

export const cloudApi = {
  async health(): Promise<{ status: string }> {
    const { data } = await client.get('/healthz');
    return data;
  },
  async listAccounts(): Promise<AccountSummary[]> {
    const { data } = await client.get('/api/v1/accounts');
    return data.accounts;
  },
  async createAccount(payload: AccountUpsertPayload): Promise<AccountSummary> {
    const { data } = await client.post('/api/v1/accounts', payload);
    return data.account;
  },
  async updateAccount(id: string, payload: AccountUpsertPayload): Promise<AccountSummary> {
    const { data } = await client.put(`/api/v1/accounts/${id}`, payload);
    return data.account;
  },
  async deleteAccount(id: string): Promise<void> {
    await client.delete(`/api/v1/accounts/${id}`);
  },
  async getBuckets(provider: string, accountId: string): Promise<BucketInfo[]> {
    const { data } = await client.get(`/api/v1/providers/${provider}/buckets`, {
      params: { accountId },
    });
    return data.buckets;
  },
  async listObjects(params: ListParams & { accountId: string }): Promise<ListResult> {
    const { data } = await client.get(`/api/v1/buckets/${params.bucket}/objects`, { params });
    return data.result;
  },
  async uploadObject(payload: UploadParams): Promise<{ transferId: string }> {
    const { data } = await client.post('/api/v1/objects/upload', payload);
    return data;
  },
  async fetchObject(payload: UploadParams): Promise<{ transferId: string }> {
    const { data } = await client.post('/api/v1/objects/fetch', payload);
    return data;
  },
  async downloadObject(payload: DownloadParams): Promise<{ transferId: string }> {
    const { data } = await client.post('/api/v1/objects/download', payload);
    return data;
  },
  async renameObject(payload: RenameParams): Promise<void> {
    await client.post('/api/v1/objects/rename', payload);
  },
  async deleteObjects(payload: { accountId: string; bucket: string; keys: string[] }): Promise<void> {
    await client.delete('/api/v1/objects', { data: payload });
  },
  async generateURL(payload: SignedURLParams): Promise<{ url: string }> {
    const { data } = await client.post('/api/v1/objects/url', payload);
    return data;
  },
  async refreshCDN(payload: { accountId: string; urls: string[] }): Promise<void> {
    await client.post('/api/v1/cdn/refresh', payload);
  },
  async prefetchCDN(payload: { accountId: string; urls: string[] }): Promise<void> {
    await client.post('/api/v1/cdn/prefetch', payload);
  },
  async getCDNQuota(accountId: string): Promise<CDNQuota | null> {
    try {
      const { data } = await client.get('/api/v1/cdn/quota', { params: { accountId } });
      return data.quota;
    } catch {
      return null;
    }
  },
  async listDomains(accountId: string, bucket: string): Promise<string[]> {
    const { data } = await client.get(`/api/v1/buckets/${bucket}/domains`, {
      params: { accountId },
    });
    return data.domains;
  },
  async listTransfers(): Promise<TransferTask[]> {
    const { data } = await client.get('/api/v1/transfers');
    return data.transfers;
  },
  async cancelTransfer(id: string): Promise<void> {
    await client.post(`/api/v1/transfers/${id}/cancel`);
  },
  async getSettings(): Promise<AppSettings> {
    const { data } = await client.get('/api/v1/settings');
    return data.settings;
  },
  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    const { data } = await client.put('/api/v1/settings', settings);
    return data.settings;
  },
  async getProviderFeatures(accountId: string): Promise<string[]> {
    const { data } = await client.get(`/api/v1/accounts/${accountId}/features`);
    return data.features;
  },

  // ---- Bucket 治理 API ----

  async getLifecycle(accountId: string, bucket: string): Promise<LifecycleRule[]> {
    const { data } = await client.get(
      `/api/v1/buckets/${bucket}/lifecycle`, { params: { accountId } },
    );
    return data.rules ?? [];
  },
  async putLifecycle(
    payload: { accountId: string; bucket: string; rules: LifecycleRule[] },
  ): Promise<void> {
    await client.put(`/api/v1/buckets/${payload.bucket}/lifecycle`, payload);
  },
  async deleteLifecycle(
    payload: { accountId: string; bucket: string },
  ): Promise<void> {
    await client.delete(`/api/v1/buckets/${payload.bucket}/lifecycle`, { data: payload });
  },

  async getCORS(accountId: string, bucket: string): Promise<CORSRule[]> {
    const { data } = await client.get(
      `/api/v1/buckets/${bucket}/cors`, { params: { accountId } },
    );
    return data.rules ?? [];
  },
  async putCORS(
    payload: { accountId: string; bucket: string; rules: CORSRule[] },
  ): Promise<void> {
    await client.put(`/api/v1/buckets/${payload.bucket}/cors`, payload);
  },

  async getReferer(accountId: string, bucket: string): Promise<RefererConfig> {
    const { data } = await client.get(
      `/api/v1/buckets/${bucket}/referer`, { params: { accountId } },
    );
    return data.config;
  },
  async putReferer(
    payload: { accountId: string; bucket: string; config: RefererConfig },
  ): Promise<void> {
    await client.put(`/api/v1/buckets/${payload.bucket}/referer`, payload);
  },

  async getEncryption(accountId: string, bucket: string): Promise<EncryptionConfig> {
    const { data } = await client.get(
      `/api/v1/buckets/${bucket}/encryption`, { params: { accountId } },
    );
    return data.config;
  },
  async putEncryption(
    payload: { accountId: string; bucket: string; config: EncryptionConfig },
  ): Promise<void> {
    await client.put(`/api/v1/buckets/${payload.bucket}/encryption`, payload);
  },

  async getVersioning(accountId: string, bucket: string): Promise<string> {
    const { data } = await client.get(
      `/api/v1/buckets/${bucket}/versioning`, { params: { accountId } },
    );
    return data.status ?? 'Suspended';
  },
  async putVersioning(
    payload: { accountId: string; bucket: string; status: string },
  ): Promise<void> {
    await client.put(`/api/v1/buckets/${payload.bucket}/versioning`, payload);
  },
};
