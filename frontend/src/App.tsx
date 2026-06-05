import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BucketPage } from '@/pages/BucketPage';

import { useAccountsQuery } from '@/hooks/useCloudApi';
import { useAccountStore } from '@/stores/useAccountStore';
import { useEffect } from 'react';
import { CommandPalette } from '@/components/CommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  const query = useAccountsQuery(true);
  const accounts = useAccountStore((s) => s.accounts);
  const setAccounts = useAccountStore((s) => s.setAccounts);

  useEffect(() => {
    if (query.data) {
      setAccounts(query.data);
    }
  }, [query.data, setAccounts]);

  const location = useLocation();

  return (
    <>
      <CommandPalette />
      <AppLayout>
        <ErrorBoundary>
          {/* 路由切换时通过 key 触发淡入动画 */}
          <div
            key={location.pathname}
            className="animate-page-in"
          >
            <Routes>
              <Route path="/bucket" element={<BucketPage />} />

              <Route
                path="*"
                element={<Navigate to="/bucket" replace />}
              />
            </Routes>
          </div>
        </ErrorBoundary>
      </AppLayout>
    </>
  );
}
