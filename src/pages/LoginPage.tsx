import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AccountCard } from '@/components/account/AccountCard';
import {
  AccountForm,
  type FormState,
} from '@/components/account/AccountForm';
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useDeleteAccountMutation,
} from '@/hooks/useCloudApi';
import { useAccountStore } from '@/stores/useAccountStore';

/** 登录页：左侧表单 + 右侧已保存账户列表 */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accounts = useAccountStore((s) => s.accounts);
  const setActiveAccountId = useAccountStore(
    (s) => s.setActiveAccountId,
  );

  const accountsQuery = useAccountsQuery();
  const createMutation = useCreateAccountMutation();
  const deleteMutation = useDeleteAccountMutation();

  /** 创建账户并跳转到浏览器页面 */
  const handleSubmit = async (form: FormState) => {
    const account =
      await createMutation.mutateAsync({ ...form });
    setActiveAccountId(account.id);
    navigate('/bucket');
  };

  /** 选中账户并跳转 */
  const handleSelect = (id: string) => {
    setActiveAccountId(id);
    navigate('/bucket');
  };

  /** 删除账户 */
  const handleDelete = (id: string) => {
    void deleteMutation.mutateAsync(id);
  };

  const isLoading =
    accountsQuery.isLoading && accounts.length === 0;

  return (
    <div
      className={[
        'mx-auto flex min-h-screen w-full max-w-6xl',
        'items-center justify-center px-6 py-8',
      ].join(' ')}
    >
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* 左侧：账户创建表单 */}
        <div
          className={[
            'rounded-2xl p-6',
            'bg-surface-container-lowest',
            'ghost-border shadow-sm',
          ].join(' ')}
        >
          <AccountForm
            isPending={createMutation.isPending}
            onSubmit={handleSubmit}
          />
        </div>

        {/* 右侧：已保存账户列表 */}
        <div
          className={[
            'rounded-2xl p-6',
            'bg-surface-container-low',
            'ghost-border',
          ].join(' ')}
        >
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {t('login.savedAccounts')}
          </h2>

          <div className="mt-4 space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : accounts.length === 0 ? (
              <EmptyState
                icon={<Inbox size={32} />}
                title={t('login.noAccounts')}
                description={t(
                  'login.noAccountsDesc',
                )}
              />
            ) : (
              accounts.map((item) => (
                <AccountCard
                  key={item.id}
                  account={item}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
