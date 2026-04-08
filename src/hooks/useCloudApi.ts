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

/** 生成签名URL，成功后自动复制到剪贴板 */
export function useGenerateUrlMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: SignedURLParams) =>
      cloudApi.generateURL(payload),
    onSuccess: async (data) => {
      try {
        if (tauriApi.isTauriEnv()) {
          await tauriApi.writeClipboardText(data.url);
        } else {
          await navigator.clipboard.writeText(data.url);
        }
        toast.success(t('toast.urlCopied'));
      } catch {
        // 复制失败时不阻断流程
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || t('toast.operationFailed'));
    },
  });
}
