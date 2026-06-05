export type ProviderKey =
  | 'qiniu'
  | 'tencent'
  | 'aliyun'
  | 'aws'
  | 'qingstor'
  | 'jd'
  | 'upyun'
  | 'minio'
  | 'ks3';

export interface ProviderConfig {
  provider: ProviderKey;
  name: string;
  accessKey: string;
  secretKey: string;
  endpoint?: string;
  region?: string;
  serviceName?: string;
  internal?: boolean;
  paging?: boolean;
}

export interface AccountSummary {
  id: string;
  provider: ProviderKey;
  name: string;
  accessKey: string;
  endpoint?: string;
  region?: string;
  serviceName?: string;
  internal: boolean;
  paging: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountUpsertPayload extends ProviderConfig {
  id?: string;
}
