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
    set((prev) => ({
      accounts: prev.accounts.filter((item) => item.id !== id),
      activeAccountId: prev.activeAccountId === id ? '' : prev.activeAccountId,
    })),
}));
