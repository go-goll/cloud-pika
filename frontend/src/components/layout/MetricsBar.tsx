import { Activity, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { deriveMetrics } from '@/lib/metrics';
import { useBucketStore } from '@/stores/useBucketStore';
import { useTransferStore } from '@/stores/useTransferStore';

export function MetricsBar() {
  const { t } = useTranslation();
  const objects = useBucketStore((s) => s.objects);
  const transfers = useTransferStore((s) => s.transfers);

  const activeTransfers = transfers.filter((item) =>
    ['queued', 'running'].includes(item.status),
  ).length;
  const metricsView = deriveMetrics({
    objectsLoaded: objects.length,
    activeTransfers,
  });

  const metrics = [
    {
      label: t('metrics.objects'),
      value: metricsView.objects,
      icon: Database,
    },
    {
      label: t('metrics.queue'),
      value: metricsView.queue,
      icon: Activity,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="atlas-panel flex min-w-0 items-center gap-3 px-3 py-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent)]">
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] text-[var(--text-secondary)]">
                {metric.label}
              </p>
              <p className="truncate text-sm font-semibold text-[var(--text)]">
                {metric.value}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
