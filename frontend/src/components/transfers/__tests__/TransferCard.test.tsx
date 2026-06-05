import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { TransferCard } from '../TransferCard';
import { createTransferTask } from '@/test/fixtures';

describe('TransferCard', () => {
  it('显示运行中任务的速度', () => {
    const task = createTransferTask({
      status: 'running',
      speed: 1048576,
      totalSize: 10485760,
      transferredSize: 5242880,
    });
    renderWithProviders(<TransferCard task={task} />);
    expect(screen.getByText('1 MB/s')).toBeInTheDocument();
  });

  it('显示运行中任务的 ETA', () => {
    const task = createTransferTask({
      status: 'running',
      speed: 1048576,
      totalSize: 10485760,
      transferredSize: 5242880,
    });
    renderWithProviders(<TransferCard task={task} />);
    // 5MB remaining at 1MB/s = 5s
    expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('显示已传输/总大小', () => {
    const task = createTransferTask({
      status: 'running',
      speed: 1024,
      totalSize: 2048,
      transferredSize: 1024,
    });
    renderWithProviders(<TransferCard task={task} />);
    expect(screen.getByText('1 KB / 2 KB')).toBeInTheDocument();
  });

  it('速度为 0 时 ETA 显示 "--"', () => {
    const task = createTransferTask({
      status: 'running',
      speed: 0,
      totalSize: 1048576,
      transferredSize: 0,
    });
    renderWithProviders(<TransferCard task={task} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('已完成任务不显示速度和 ETA', () => {
    const task = createTransferTask({
      status: 'completed',
      speed: 1048576,
      totalSize: 10485760,
      transferredSize: 10485760,
    });
    renderWithProviders(<TransferCard task={task} />);
    expect(screen.queryByText('1 MB/s')).not.toBeInTheDocument();
  });

  it('排队中任务不显示速度和 ETA', () => {
    const task = createTransferTask({
      status: 'queued',
      speed: 0,
      totalSize: 1048576,
    });
    renderWithProviders(<TransferCard task={task} />);
    expect(screen.queryByText(/\/s$/)).not.toBeInTheDocument();
  });

  it('显示进度百分比', () => {
    const task = createTransferTask({
      status: 'running',
      progress: 50,
    });
    renderWithProviders(<TransferCard task={task} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('显示错误信息', () => {
    const task = createTransferTask({
      status: 'failed',
      errorMessage: 'Network error',
    });
    renderWithProviders(<TransferCard task={task} />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });
});
