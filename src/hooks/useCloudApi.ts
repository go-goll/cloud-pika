import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cloudApi } from '@/lib/api-client';
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
  return useMutation({
    mutationFn: (payload: AccountUpsertPayload) => cloudApi.createAccount(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDeleteAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cloudApi.deleteAccount(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['accounts'] }),
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
  return useMutation({
    mutationFn: (settings: AppSettings) => cloudApi.updateSettings(settings),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
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
  return useMutation({
    mutationFn: (payload: UploadParams) => cloudApi.uploadObject(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}

export function useFetchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadParams) => cloudApi.fetchObject(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}

export function useDownloadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DownloadParams) => cloudApi.downloadObject(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}

export function useRenameMutation() {
  return useMutation({
    mutationFn: (payload: RenameParams) => cloudApi.renameObject(payload),
  });
}

export function useDeleteObjectsMutation() {
  return useMutation({
    mutationFn: (payload: { accountId: string; bucket: string; keys: string[] }) =>
      cloudApi.deleteObjects(payload),
  });
}

export function useGenerateUrlMutation() {
  return useMutation({
    mutationFn: (payload: SignedURLParams) => cloudApi.generateURL(payload),
  });
}
