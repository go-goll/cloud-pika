import type { ProviderKey } from '@/types/account';

export const providerOptions: Array<{ value: ProviderKey; label: string }> = [
  { value: 'qiniu', label: '七牛云 / Qiniu' },
  { value: 'tencent', label: '腾讯云 COS' },
  { value: 'aliyun', label: '阿里云 OSS' },
  { value: 'aws', label: 'AWS S3' },
  { value: 'qingstor', label: '青云 QingStor' },
  { value: 'jd', label: '京东云 S3' },
  { value: 'upyun', label: '又拍云 UPYUN' },
  { value: 'minio', label: 'MinIO' },
  { value: 'ks3', label: '金山云 KS3' },
];
