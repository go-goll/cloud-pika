import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cloudApi } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import { tauriApi } from '@/lib/tauri';
import type { AccountUpsertPayload } from '@/types/account';
import type {
  AppSettings,
  DownloadParams,
  ListParams,
  RenameParams,
  SignedURLParams,
  UploadParams,
} from '@/types/cloud';

export function useAccountsQuery(enabled = true) {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: cloudApi.listAccounts,
    enabled,
  });
}

export function useCreateAccountMutation() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: AccountUpsertPayload) =>
      cloudApi.createAccount(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(t('toast.accountCreated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

export function useDeleteAccountMutation() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => cloudApi.deleteAccount(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(t('toast.accountDeleted'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

export function useBucketsQuery(provider: string, accountId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['buckets', provider, accountId],
    queryFn: () => cloudApi.getBuckets(provider, accountId),
    enabled,
  });
}

export function useObjectsQuery(params: ListParams & { accountId: string }, enabled: boolean) {
  return useQuery({
    queryKey: ['objects', params],
    queryFn: () => cloudApi.listObjects(params),
    enabled,
  });
}

export function useTransfersQuery(enabled = true) {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: cloudApi.listTransfers,
    enabled,
    refetchInterval: 3000,
  });
}

export function useCancelTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cloudApi.cancelTransfer(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}

export function useSaveSettingsMutation() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (settings: AppSettings) =>
      cloudApi.updateSettings(settings),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success(t('toast.settingsSaved'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

export function useSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['settings'],
    queryFn: cloudApi.getSettings,
    enabled,
  });
}

export function useUploadMutation() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: UploadParams) =>
      cloudApi.uploadObject(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('toast.uploadCreated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

export function useFetchMutation() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: UploadParams) =>
      cloudApi.fetchObject(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('toast.uploadCreated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

export function useDownloadMutation() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: DownloadParams) =>
      cloudApi.downloadObject(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('toast.downloadCreated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

export function useRenameMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: RenameParams) =>
      cloudApi.renameObject(payload),
    onSuccess: () => {
      toast.success(t('toast.renameSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

export function useDeleteObjectsMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: {
      accountId: string;
      bucket: string;
      keys: string[];
    }) => cloudApi.deleteObjects(payload),
    onSuccess: () => {
      toast.success(t('toast.deleteSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

/** 生成签名URL */
export function useGenerateUrlMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: SignedURLParams) =>
      cloudApi.generateURL(payload),
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}

/** 查询 provider 支持的功能列表 */
export function useProviderFeaturesQuery(
  accountId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['features', accountId],
    queryFn: () => cloudApi.getProviderFeatures(accountId),
    enabled,
    staleTime: Infinity,
  });
}

/** 查询 bucket 绑定的自定义域名列表 */
export function useDomainsQuery(
  accountId: string,
  bucket: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['domains', accountId, bucket],
    queryFn: () => cloudApi.listDomains(accountId, bucket),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** 刷新 CDN 缓存 */
export function useRefreshCDNMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: { accountId: string; urls: string[] }) =>
      cloudApi.refreshCDN(payload),
    onSuccess: () => {
      toast.success(t('toast.cdnRefreshed'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}
