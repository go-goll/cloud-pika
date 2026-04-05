import type { ObjectItem } from '@/types/cloud';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface ResourceTableProps {
  objects: ObjectItem[];
  onCopyUrl?: (key: string) => void;
  onDelete?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
}

export function ResourceTable({
  objects,
  onCopyUrl,
  onDelete,
  onDownload,
  onRename,
}: ResourceTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[var(--radius)] bg-[var(--surface-low)] p-3">
      <table className="w-full border-separate border-spacing-y-2 text-sm">
        <thead className="text-left text-[var(--text-muted)]">
          <tr>
            <th className="px-3">Key</th>
            <th className="px-3">Size</th>
            <th className="px-3">MIME</th>
            <th className="px-3">Updated</th>
            <th className="px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {objects.map((item) => (
            <tr
              key={item.key}
              className="rounded-[var(--radius)] bg-[var(--surface-high)] transition-colors hover:bg-[var(--surface-elevated)]"
            >
              <td className="rounded-l-[var(--radius)] px-3 py-2.5">{item.key}</td>
              <td className="px-3 py-2.5">{item.size}</td>
              <td className="px-3 py-2.5 text-[var(--text-muted)]">{item.mimeType ?? '-'}</td>
              <td className="rounded-r-[var(--radius)] px-3 py-2.5 text-[var(--text-muted)]">
                {item.lastModified ?? '-'}
              </td>
              <td className="px-3 py-2.5 text-right">
                <div className="flex justify-end gap-2">
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
              </td>
            </tr>
          ))}
          {objects.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-[var(--text-muted)]">
                {t('bucket.empty')}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
