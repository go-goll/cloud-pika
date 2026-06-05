/**
 * UrlDialog - URL生成和复制对话框组件
 * 支持域名选择、签名/公开URL切换、设为默认域名
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Copy, Link, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { tauriApi } from '@/lib/tauri';
import { formatCopyUrl } from '@/lib/format';
import type { DomainPref } from '@/stores/useBucketStore';

interface UrlDialogProps {
  open: boolean;
  objectKey: string;
  initialUrl: string;
  domains: string[];
  domainPref?: DomainPref;
  copyType: 'url' | 'markdown';
  https: boolean;
  onClose: () => void;
  onRegenerate: (
    domain: string,
    signed: boolean,
  ) => Promise<string>;
  onSaveDomainPref: (pref: DomainPref) => void;
}

export function UrlDialog({
  open,
  objectKey,
  initialUrl,
  domains,
  domainPref,
  copyType,
  https,
  onClose,
  onRegenerate,
  onSaveDomainPref,
}: UrlDialogProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);

  const hasDomains = domains.length > 0;

  const [selectedDomain, setSelectedDomain] = useState(
    domainPref?.domain || domains[0] || '',
  );
  const [signed, setSigned] = useState(
    domainPref?.signed ?? true,
  );
  const [setAsDefault, setSetAsDefault] = useState(false);

  // 当对话框打开时重置状态
  useEffect(() => {
    if (open) {
      setCurrentUrl(initialUrl);
      setCopied(false);
      setSetAsDefault(false);
      setSelectedDomain(
        domainPref?.domain || domains[0] || '',
      );
      setSigned(domainPref?.signed ?? true);
    }
  }, [open, initialUrl, domainPref, domains]);

  /** 切换域名或签名模式时重新生成URL */
  const regenerate = useCallback(
    async (domain: string, isSigned: boolean) => {
      setLoading(true);
      try {
        const url = await onRegenerate(domain, isSigned);
        setCurrentUrl(url);
      } finally {
        setLoading(false);
      }
    },
    [onRegenerate],
  );

  const handleDomainChange = useCallback(
    (domain: string) => {
      setSelectedDomain(domain);
      void regenerate(domain, signed);
    },
    [signed, regenerate],
  );

  const handleSignedChange = useCallback(
    (isSigned: boolean) => {
      setSigned(isSigned);
      if (hasDomains) {
        void regenerate(selectedDomain, isSigned);
      }
    },
    [hasDomains, selectedDomain, regenerate],
  );

  const handleCopy = useCallback(async () => {
    try {
      const formatted = formatCopyUrl(
        currentUrl,
        objectKey,
        copyType,
      );
      if (tauriApi.isTauriEnv()) {
        await tauriApi.writeClipboardText(formatted);
      } else {
        await navigator.clipboard.writeText(formatted);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败静默处理
    }
  }, [currentUrl, objectKey, copyType]);

  const handleClose = useCallback(() => {
    if (setAsDefault && hasDomains) {
      onSaveDomainPref({
        domain: selectedDomain,
        signed,
      });
    }
    onClose();
  }, [
    setAsDefault, hasDomains, selectedDomain,
    signed, onSaveDomainPref, onClose,
  ]);

  const domainOptions = domains.map((d) => ({
    value: d,
    label: d,
  }));

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-[480px]',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-xl bg-surface-container-lowest',
            'p-6 ghost-border shadow-ambient',
          ].join(' ')}
        >
          <Dialog.Title className="flex items-center gap-2 text-base font-semibold text-on-surface">
            <Link size={16} className="text-primary" />
            {t('bucket.copyUrl')}
          </Dialog.Title>

          {/* 域名选择器（仅当有自定义域名时显示） */}
          {hasDomains ? (
            <div className="mt-4 space-y-3">
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest">
                {t('bucket.domain')}
              </label>
              <Select
                value={selectedDomain}
                onChange={handleDomainChange}
                options={domainOptions}
                label={t('bucket.domainDefault')}
              />

              {/* 签名/公开切换 */}
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="urlType"
                    checked={signed}
                    onChange={() => handleSignedChange(true)}
                    className="accent-[var(--primary)]"
                  />
                  {t('bucket.signedUrl')}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="urlType"
                    checked={!signed}
                    onChange={() => handleSignedChange(false)}
                    className="accent-[var(--primary)]"
                  />
                  {t('bucket.publicUrl')}
                </label>
              </div>
            </div>
          ) : null}

          {/* URL显示 */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Input
                value={currentUrl}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 rounded-xl">
                  <Loader2
                    size={16}
                    className="animate-spin text-primary"
                  />
                </div>
              ) : null}
            </div>
            <Button
              variant={copied ? 'secondary' : 'primary'}
              onClick={() => void handleCopy()}
              disabled={loading}
            >
              {copied ? (
                <Check size={15} />
              ) : (
                <Copy size={15} />
              )}
            </Button>
          </div>

          {/* 设为默认 + 关闭 */}
          <div className="mt-5 flex items-center justify-between">
            {hasDomains ? (
              <Checkbox
                label={t('bucket.setDefaultDomain')}
                checked={setAsDefault}
                onCheckedChange={(v) =>
                  setSetAsDefault(Boolean(v))
                }
              />
            ) : (
              <span />
            )}
            <Button
              variant="secondary"
              onClick={handleClose}
            >
              {t('common.close')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
