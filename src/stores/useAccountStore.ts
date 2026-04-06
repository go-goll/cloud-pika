import { create } from 'zustand';
import type { AccountSummary } from '@/types/account';

interface AccountState {
  accounts: AccountSummary[];
  activeAccountId: string;
  setAccounts: (accounts: AccountSummary[]) => void;
  setActiveAccountId: (id: string) => void;
  removeAccount: (id: string) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  activeAccountId: '',
  setAccounts: (accounts) =>
    set((prev) => ({
      accounts,
      activeAccountId: prev.activeAccountId || accounts[0]?.id || '',
    })),
  setActiveAccountId: (activeAccountId) => set({ activeAccountId }),
  removeAccount: (id) =>
    set((prev) => {
      const accounts = prev.accounts.filter((item) => item.id !== id);
      const activeAccountId =
        prev.activeAccountId === id ? (accounts[0]?.id ?? '') : prev.activeAccountId;
      return { accounts, activeAccountId };
    }),
}));
