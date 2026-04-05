import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface ResourceFilterProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
}

export function ResourceFilter({ keyword, onKeywordChange }: ResourceFilterProps) {
  return (
    <div className="relative max-w-[420px]">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
      <Input
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="Search key/prefix"
        className="pl-9"
      />
    </div>
  );
}
