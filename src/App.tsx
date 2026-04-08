import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BucketPage } from '@/pages/BucketPage';
import { LoginPage } from '@/pages/LoginPage';
import { TransfersPage } from '@/pages/TransfersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useAccountsQuery } from '@/hooks/useCloudApi';
import { useAccountStore } from '@/stores/useAccountStore';
import { useEffect } from 'react';

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

  if (accounts.length === 0) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      {/* 路由切换时通过 key 触发淡入动画 */}
      <div key={location.pathname} className="animate-page-in">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/bucket" element={<BucketPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={<Navigate to="/bucket" replace />}
          />
        </Routes>
      </div>
    </AppLayout>
  );
}
