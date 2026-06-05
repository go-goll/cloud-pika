import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  fieldIsRequired,
  getMissingRequiredField,
  getProviderOption,
  providerOptions,
  type LoginFieldKey,
} from '@/lib/provider';
import { useCreateAccountMutation, useDeleteAccountMutation } from '@/hooks/useCloudApi';
import { useAccountStore } from '@/stores/useAccountStore';
import type { ProviderKey } from '@/types/account';

const defaults = {
  provider: 'qiniu' as ProviderKey,
  name: getProviderOption('qiniu').defaultAlias,
  accessKey: '',
  secretKey: '',
  endpoint: '',
  region: '',
  serviceName: '',
  internal: false,
  paging: false,
};

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accounts = useAccountStore((s) => s.accounts);
  const setActiveAccountId = useAccountStore((s) => s.setActiveAccountId);
  const [form, setForm] = useState(defaults);
  const [nameTouched, setNameTouched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const createMutation = useCreateAccountMutation();
  const deleteMutation = useDeleteAccountMutation();
  const providerMeta = useMemo(() => getProviderOption(form.provider), [form.provider]);

  useEffect(() => {
    if (!nameTouched) {
      setForm((prev) => ({ ...prev, name: providerMeta.defaultAlias }));
    }
  }, [nameTouched, providerMeta.defaultAlias]);

  const showEndpoint =
    fieldIsRequired(providerMeta.endpointMode) ||
    (providerMeta.endpointMode === 'optional' && showAdvanced);
  const showRegion =
    fieldIsRequired(providerMeta.regionMode) || (providerMeta.regionMode === 'optional' && showAdvanced);
  const showInternal = providerMeta.showInternal && showAdvanced;
  const canToggleAdvanced =
    providerMeta.endpointMode === 'optional' ||
    providerMeta.regionMode === 'optional' ||
    providerMeta.showInternal;

  const getFieldLabel = (field: LoginFieldKey): string => {
    switch (field) {
      case 'name':
        return t('login.alias');
      case 'accessKey':
        return t(providerMeta.accessKeyLabelKey ?? 'login.accessKey');
      case 'secretKey':
        return t(providerMeta.secretKeyLabelKey ?? 'login.secretKey');
      case 'serviceName':
        return t('login.serviceName');
      case 'endpoint':
        return t('login.endpoint');
      case 'region':
        return t('login.region');
      default:
        return field;
    }
  };

  const onSubmit = async () => {
    const missing = getMissingRequiredField(form);
    if (missing) {
      setSubmitError(t('login.requiredField', { field: getFieldLabel(missing) }));
      return;
    }

    try {
      setSubmitError('');
      const account = await createMutation.mutateAsync({
        ...form,
        endpoint: form.endpoint.trim(),
        region: form.region.trim(),
        serviceName: form.serviceName.trim(),
      });
      setActiveAccountId(account.id);
      navigate('/bucket');
    } catch (error) {
      const fallback = t('login.connectFailed');
      if (error instanceof AxiosError) {
        const response = error.response?.data as
          | { error?: string; message?: string; detail?: string }
          | undefined;
        setSubmitError(response?.message || response?.error || response?.detail || error.message || fallback);
      } else if (error instanceof Error) {
        setSubmitError(error.message || fallback);
      } else {
        setSubmitError(fallback);
      }
    }
  };

  const onDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div
      className={
        'mx-auto flex w-full max-w-6xl '
        + 'items-start justify-center px-4 py-6 '
        + 'sm:px-6 sm:py-8 lg:items-center lg:min-h-screen'
      }
    >
      <div
        className={
          'grid w-full gap-6 '
          + 'grid-cols-1 lg:grid-cols-[1.2fr_1fr]'
        }
      >
        <Card className="bg-[var(--surface-high)] p-6">
          <h1 className="font-display text-3xl font-semibold">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t('login.subtitle')}</p>

          <div className="mt-6 grid gap-4">
            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">{t('login.provider')}</span>
              <Select
                value={form.provider}
                onChange={(val) => {
                  const nextProvider = val as ProviderKey;
                  const nextMeta = getProviderOption(nextProvider);
                  setShowAdvanced(false);
                  setSubmitError('');
                  setForm((prev) => ({
                    ...prev,
                    provider: nextProvider,
                    name: nameTouched
                      ? prev.name
                      : nextMeta.defaultAlias,
                    serviceName: nextMeta.serviceNameMode === 'hidden'
                      ? '' : prev.serviceName,
                    endpoint: nextMeta.endpointMode === 'hidden'
                      ? '' : prev.endpoint,
                    region: nextMeta.regionMode === 'hidden'
                      ? '' : prev.region,
                    internal: nextMeta.showInternal
                      ? prev.internal : false,
                  }));
                }}
                options={providerOptions.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                label={t('login.provider')}
              />
            </label>

            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">{t('login.alias')}</span>
              <Input
                value={form.name}
                onChange={(event) => {
                  setNameTouched(true);
                  setForm((prev) => ({ ...prev, name: event.target.value }));
                }}
              />
            </label>

            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">
                {t(providerMeta.accessKeyLabelKey ?? 'login.accessKey')}
              </span>
              <Input
                value={form.accessKey}
                onChange={(event) => setForm((prev) => ({ ...prev, accessKey: event.target.value }))}
              />
            </label>

            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">
                {t(providerMeta.secretKeyLabelKey ?? 'login.secretKey')}
              </span>
              <Input
                type="password"
                value={form.secretKey}
                onChange={(event) => setForm((prev) => ({ ...prev, secretKey: event.target.value }))}
              />
            </label>

            {providerMeta.serviceNameMode !== 'hidden' ? (
              <label className="text-sm">
                <span className="mb-2 block text-[var(--text-muted)]">{t('login.serviceName')}</span>
                <Input
                  value={form.serviceName}
                  onChange={(event) => setForm((prev) => ({ ...prev, serviceName: event.target.value }))}
                  placeholder={t('login.serviceNamePlaceholder')}
                />
              </label>
            ) : null}

            {canToggleAdvanced ? (
              <button
                type="button"
                className="w-fit text-xs text-[var(--text-muted)] underline-offset-4 hover:underline"
                onClick={() => setShowAdvanced((value) => !value)}
              >
                {showAdvanced ? t('login.hideAdvanced') : t('login.showAdvanced')}
              </button>
            ) : null}

            {showEndpoint || showRegion || showInternal ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {showEndpoint ? (
                  <label className="text-sm">
                    <span className="mb-2 block text-[var(--text-muted)]">{t('login.endpoint')}</span>
                    <Input
                      value={form.endpoint}
                      onChange={(event) => setForm((prev) => ({ ...prev, endpoint: event.target.value }))}
                      placeholder={t('login.endpointPlaceholder')}
                    />
                  </label>
                ) : null}
                {showRegion ? (
                  <label className="text-sm">
                    <span className="mb-2 block text-[var(--text-muted)]">{t('login.region')}</span>
                    <Input
                      value={form.region}
                      onChange={(event) => setForm((prev) => ({ ...prev, region: event.target.value }))}
                      placeholder={t('login.regionPlaceholder')}
                    />
                  </label>
                ) : null}
                {showInternal ? (
                  <label className="col-span-full flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={form.internal}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, internal: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    {t('login.internal')}
                  </label>
                ) : null}
              </div>
            ) : null}

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => void onSubmit()}
                disabled={createMutation.isPending}
              >
                {t('login.connect')}
              </Button>
              {submitError ? <p className="mt-2 text-xs text-[var(--danger)]">{submitError}</p> : null}
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--surface-low)] p-6">
          <h2 className="font-display text-xl font-semibold">{t('login.recent')}</h2>
          <div className="mt-4 space-y-2">
            {accounts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[var(--radius)] bg-[var(--surface-high)] px-3 py-2"
              >
                <button
                  type="button"
                  className="flex flex-col text-left"
                  onClick={() => {
                    setActiveAccountId(item.id);
                    navigate('/bucket');
                  }}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{item.provider}</span>
                </button>
                <button
                  type="button"
                  className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
                  onClick={() => void onDelete(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {accounts.length === 0 ? (
              <p className="rounded-[var(--radius)] bg-[var(--surface-high)] px-3 py-5 text-center text-sm text-[var(--text-muted)]">
                {t('login.empty')}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
