import type { ProviderConfig, ProviderKey } from '@/types/account';

export type FieldMode = 'hidden' | 'optional' | 'required';
export type LoginFieldKey =
  | 'name'
  | 'accessKey'
  | 'secretKey'
  | 'endpoint'
  | 'region'
  | 'serviceName';

export interface ProviderOption {
  value: ProviderKey;
  label: string;
  defaultAlias: string;
  endpointMode: FieldMode;
  regionMode: FieldMode;
  serviceNameMode: FieldMode;
  showInternal: boolean;
  accessKeyLabelKey?: string;
  secretKeyLabelKey?: string;
}

export const providerOptions: ProviderOption[] = [
  {
    value: 'qiniu',
    label: '七牛云 / Qiniu',
    defaultAlias: '七牛云',
    endpointMode: 'optional',
    regionMode: 'optional',
    serviceNameMode: 'hidden',
    showInternal: false,
  },
  {
    value: 'tencent',
    label: '腾讯云 COS',
    defaultAlias: '腾讯云 COS',
    endpointMode: 'optional',
    regionMode: 'optional',
    serviceNameMode: 'hidden',
    showInternal: false,
  },
  {
    value: 'aliyun',
    label: '阿里云 OSS',
    defaultAlias: '阿里云 OSS',
    endpointMode: 'optional',
    regionMode: 'optional',
    serviceNameMode: 'hidden',
    showInternal: true,
  },
  {
    value: 'aws',
    label: 'AWS S3',
    defaultAlias: 'AWS S3',
    endpointMode: 'optional',
    regionMode: 'required',
    serviceNameMode: 'hidden',
    showInternal: false,
  },
  {
    value: 'qingstor',
    label: '青云 QingStor',
    defaultAlias: '青云 QingStor',
    endpointMode: 'optional',
    regionMode: 'optional',
    serviceNameMode: 'hidden',
    showInternal: false,
  },
  {
    value: 'jd',
    label: '京东云 S3',
    defaultAlias: '京东云 S3',
    endpointMode: 'optional',
    regionMode: 'required',
    serviceNameMode: 'hidden',
    showInternal: false,
  },
  {
    value: 'upyun',
    label: '又拍云 UPYUN',
    defaultAlias: '又拍云 UPYUN',
    endpointMode: 'hidden',
    regionMode: 'hidden',
    serviceNameMode: 'required',
    showInternal: false,
    accessKeyLabelKey: 'login.operator',
    secretKeyLabelKey: 'login.operatorPassword',
  },
  {
    value: 'minio',
    label: 'MinIO',
    defaultAlias: 'MinIO',
    endpointMode: 'required',
    regionMode: 'optional',
    serviceNameMode: 'hidden',
    showInternal: false,
  },
  {
    value: 'ks3',
    label: '金山云 KS3',
    defaultAlias: '金山云 KS3',
    endpointMode: 'optional',
    regionMode: 'optional',
    serviceNameMode: 'hidden',
    showInternal: false,
  },
];

export function getProviderOption(provider: ProviderKey): ProviderOption {
  return providerOptions.find((item) => item.value === provider) ?? providerOptions[0];
}

export function fieldIsVisible(mode: FieldMode): boolean {
  return mode !== 'hidden';
}

export function fieldIsRequired(mode: FieldMode): boolean {
  return mode === 'required';
}

export function getMissingRequiredField(form: ProviderConfig): LoginFieldKey | null {
  const provider = getProviderOption(form.provider);

  const base: Array<{ key: LoginFieldKey; value: string }> = [
    { key: 'name', value: form.name },
    { key: 'accessKey', value: form.accessKey },
    { key: 'secretKey', value: form.secretKey },
  ];

  for (const item of base) {
    if (!item.value?.trim()) {
      return item.key;
    }
  }

  if (fieldIsRequired(provider.serviceNameMode) && !form.serviceName?.trim()) {
    return 'serviceName';
  }
  if (fieldIsRequired(provider.endpointMode) && !form.endpoint?.trim()) {
    return 'endpoint';
  }
  if (fieldIsRequired(provider.regionMode) && !form.region?.trim()) {
    return 'region';
  }

  return null;
}
