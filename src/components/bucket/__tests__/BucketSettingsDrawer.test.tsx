import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { BucketSettingsDrawer } from '../BucketSettingsDrawer';
import { vi } from 'vitest';

// Mock API 调用避免实际网络请求
vi.mock('@/lib/api-client', () => ({
  cloudApi: {
    getLifecycle: vi.fn().mockResolvedValue([
      { id: 'rule-1', prefix: 'logs/', enabled: true, expiration: 30 },
    ]),
    putLifecycle: vi.fn().mockResolvedValue(undefined),
    deleteLifecycle: vi.fn().mockResolvedValue(undefined),
    getCORS: vi.fn().mockResolvedValue([]),
    putCORS: vi.fn().mockResolvedValue(undefined),
    getReferer: vi.fn().mockResolvedValue({
      enabled: false, type: 'whitelist', allowEmpty: true, referers: [],
    }),
    putReferer: vi.fn().mockResolvedValue(undefined),
    getEncryption: vi.fn().mockResolvedValue({ enabled: false, algorithm: 'AES256' }),
    putEncryption: vi.fn().mockResolvedValue(undefined),
    getVersioning: vi.fn().mockResolvedValue('Suspended'),
    putVersioning: vi.fn().mockResolvedValue(undefined),
  },
}));

const baseProps = {
  open: true,
  onClose: vi.fn(),
  accountId: 'acc-1',
  bucket: 'test-bucket',
};

describe('BucketSettingsDrawer', () => {
  it('根据 features 渲染对应 Tab', () => {
    renderWithProviders(
      <BucketSettingsDrawer
        {...baseProps}
        features={['lifecycle', 'cors']}
      />,
    );
    expect(screen.getByText('Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('CORS')).toBeInTheDocument();
    expect(screen.queryByText('Referer')).not.toBeInTheDocument();
    expect(screen.queryByText('Encryption')).not.toBeInTheDocument();
    expect(screen.queryByText('Versioning')).not.toBeInTheDocument();
  });

  it('没有治理功能时显示提示信息', () => {
    renderWithProviders(
      <BucketSettingsDrawer {...baseProps} features={[]} />,
    );
    expect(
      screen.getByText('No governance features supported by this provider'),
    ).toBeInTheDocument();
  });

  it('lifecycle Tab 渲染已有规则', async () => {
    renderWithProviders(
      <BucketSettingsDrawer
        {...baseProps}
        features={['lifecycle']}
      />,
    );
    // 等待异步数据加载
    expect(
      await screen.findByText('logs/'),
    ).toBeInTheDocument();
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it('所有治理功能都可见时渲染五个 Tab', () => {
    renderWithProviders(
      <BucketSettingsDrawer
        {...baseProps}
        features={['lifecycle', 'cors', 'referer', 'encryption', 'versioning']}
      />,
    );
    expect(screen.getByText('Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('CORS')).toBeInTheDocument();
    expect(screen.getByText('Referer')).toBeInTheDocument();
    expect(screen.getByText('Encryption')).toBeInTheDocument();
    expect(screen.getByText('Versioning')).toBeInTheDocument();
  });
});
