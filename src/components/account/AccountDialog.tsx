import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AccountCard } from './AccountCard';
import { AccountForm, type FormState } from './AccountForm';
import {
  useCreateAccountMutation,
  useDeleteAccountMutation,
} from '@/hooks/useCloudApi';
import { useAccountStore } from '@/stores/useAccountStore';

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 账户管理对话框：选择已有账户或添加新账户 */
export function AccountDialog({
  open,
  onClose,
}: AccountDialogProps) {
  const { t } = useTranslation();
  const accounts = useAccountStore((s) => s.accounts);
  const setActiveAccountId = useAccountStore(
    (s) => s.setActiveAccountId,
  );
  const [showForm, setShowForm] = useState(false);

  const createMutation = useCreateAccountMutation();
  const deleteMutation = useDeleteAccountMutation();

  const handleSubmit = async (form: FormState) => {
    const account = await createMutation.mutateAsync({
      ...form,
      endpoint: form.endpoint.trim(),
      region: form.region.trim(),
      serviceName: form.serviceName.trim(),
    });
    setActiveAccountId(account.id);
    setShowForm(false);
    onClose();
  };

  const handleSelect = (id: string) => {
    setActiveAccountId(id);
    onClose();
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  if (showForm) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            setShowForm(false);
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <AccountForm
            isPending={createMutation.isPending}
            onSubmit={handleSubmit}
            onBack={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center text-center">
          {/* Logo + 品牌 */}
          <img
            src="/images/logo.svg"
            alt="Cloud Pika"
            className="h-12 w-12"
          />
          <h1 className="mt-3 text-xl font-bold text-[var(--text)]">
            {t('appName')}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {t('login.appSubtitle')}
          </p>

          {/* 选择账户标题 */}
          <h2 className="mt-6 text-lg font-semibold text-[var(--text)]">
            {t('login.selectAccount')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t('login.chooseConnection')}
          </p>

          {/* 账户列表 */}
          <div className="mt-4 w-full space-y-2">
            {accounts.length > 0 ? (
              accounts.map((item) => (
                <AccountCard
                  key={item.id}
                  account={item}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <p className="rounded-xl bg-[var(--bg-raised)] px-3 py-5 text-center text-sm text-[var(--text-secondary)]">
                {t('login.empty')}
              </p>
            )}
          </div>

          {/* 添加账户按钮 */}
          <Button
            className="mt-4 w-full py-3"
            size="lg"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} className="mr-1.5" />
            {t('login.addAccount')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
