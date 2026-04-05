import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { providerOptions } from '@/lib/provider';
import { useCreateAccountMutation, useDeleteAccountMutation } from '@/hooks/useCloudApi';
import { useAccountStore } from '@/stores/useAccountStore';
import type { ProviderKey } from '@/types/account';

const defaults = {
  provider: 'qiniu' as ProviderKey,
  name: '七牛云',
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

  const createMutation = useCreateAccountMutation();
  const deleteMutation = useDeleteAccountMutation();

  const providerLabel = useMemo(
    () => providerOptions.find((item) => item.value === form.provider)?.label ?? '',
    [form.provider],
  );

  useEffect(() => {
    if (!form.name.trim()) {
      setForm((prev) => ({ ...prev, name: providerLabel }));
    }
  }, [providerLabel, form.name]);

  const onSubmit = async () => {
    if (!form.name || !form.accessKey || !form.secretKey) {
      return;
    }
    const account = await createMutation.mutateAsync(form);
    setActiveAccountId(account.id);
    navigate('/bucket');
  };

  const onDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="bg-[var(--surface-high)] p-6">
          <h1 className="font-display text-3xl font-semibold">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t('login.subtitle')}</p>

          <div className="mt-6 grid gap-4">
            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">{t('login.provider')}</span>
              <Select
                value={form.provider}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, provider: event.target.value as ProviderKey }))
                }
              >
                {providerOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </label>

            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">{t('login.alias')}</span>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>

            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">{t('login.accessKey')}</span>
              <Input
                value={form.accessKey}
                onChange={(event) => setForm((prev) => ({ ...prev, accessKey: event.target.value }))}
              />
            </label>

            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">{t('login.secretKey')}</span>
              <Input
                type="password"
                value={form.secretKey}
                onChange={(event) => setForm((prev) => ({ ...prev, secretKey: event.target.value }))}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-2 block text-[var(--text-muted)]">{t('login.endpoint')}</span>
                <Input
                  value={form.endpoint}
                  onChange={(event) => setForm((prev) => ({ ...prev, endpoint: event.target.value }))}
                />
              </label>

              <label className="text-sm">
                <span className="mb-2 block text-[var(--text-muted)]">{t('login.region')}</span>
                <Input
                  value={form.region}
                  onChange={(event) => setForm((prev) => ({ ...prev, region: event.target.value }))}
                />
              </label>
            </div>

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => void onSubmit()}
                disabled={createMutation.isPending}
              >
                {t('login.connect')}
              </Button>
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
