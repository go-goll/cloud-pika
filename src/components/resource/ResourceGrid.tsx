import type { ObjectItem } from '@/types/cloud';
import { Card } from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface ResourceGridProps {
  objects: ObjectItem[];
  onCopyUrl?: (key: string) => void;
  onDelete?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
}

export function ResourceGrid({
  objects,
  onCopyUrl,
  onDelete,
  onDownload,
  onRename,
}: ResourceGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {objects.map((item) => (
        <Card key={item.key} className="bg-[var(--surface-low)]">
          <p className="truncate text-sm font-medium">{item.key}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">{item.mimeType ?? '-'}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{item.size} bytes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onCopyUrl?.(item.key)}>
              URL
            </Button>
            <Button variant="secondary" onClick={() => onDownload?.(item.key)}>
              ↓
            </Button>
            <Button variant="secondary" onClick={() => onRename?.(item.key)}>
              Rename
            </Button>
            <Button variant="secondary" onClick={() => onDelete?.(item.key)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
      {objects.length === 0 ? <p className="text-sm text-[var(--text-muted)]">{t('bucket.empty')}</p> : null}
    </div>
  );
}
