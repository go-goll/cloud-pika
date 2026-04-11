/**
 * BucketSettingsDrawer - Bucket 治理设置抽屉
 * 右侧滑出面板，按 feature flag 展示生命周期/CORS/防盗链/加密/版本控制 Tab
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Globe,
  Lock,
  Plus,
  Shield,
  Trash2,
  GitBranch,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  useCORSRulesQuery,
  useDeleteLifecycleRulesMutation,
  useEncryptionQuery,
  useLifecycleRulesQuery,
  usePutCORSRulesMutation,
  usePutEncryptionMutation,
  usePutLifecycleRulesMutation,
  usePutRefererConfigMutation,
  usePutVersioningMutation,
  useRefererConfigQuery,
  useVersioningQuery,
} from '@/hooks/useCloudApi';
import type {
  CORSRule,
  EncryptionConfig,
  LifecycleRule,
  RefererConfig,
} from '@/types/cloud';

interface BucketSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  bucket: string;
  features: string[];
}

/** 治理功能 Tab 定义 */
interface TabDef {
  key: string;
  featureFlag: string;
  icon: React.ReactNode;
}

const TAB_DEFS: TabDef[] = [
  { key: 'lifecycle', featureFlag: 'lifecycle', icon: <Clock size={15} /> },
  { key: 'cors', featureFlag: 'cors', icon: <Globe size={15} /> },
  { key: 'referer', featureFlag: 'referer', icon: <Shield size={15} /> },
  { key: 'encryption', featureFlag: 'encryption', icon: <Lock size={15} /> },
  { key: 'versioning', featureFlag: 'versioning', icon: <GitBranch size={15} /> },
];

export function BucketSettingsDrawer({
  open,
  onClose,
  accountId,
  bucket,
  features,
}: BucketSettingsDrawerProps) {
  const { t } = useTranslation();

  const availableTabs = useMemo(
    () => TAB_DEFS.filter((td) => features.includes(td.featureFlag)),
    [features],
  );

  const [activeTab, setActiveTab] = useState('');

  // 打开时重置到第一个可用 Tab
  useEffect(() => {
    if (open && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].key);
    }
  }, [open, availableTabs]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            'fixed inset-0 z-50',
            'bg-black/30 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in',
            'data-[state=closed]:animate-[fadeOut_100ms_ease-in]',
          ].join(' ')}
        />
        <Dialog.Content
          className={[
            'fixed right-0 top-0 z-50',
            'h-full w-[520px]',
            'rounded-l-2xl',
            'bg-[var(--bg-card)]',
            'shadow-xl',
            'flex flex-col',
            'animate-slide-in-right',
          ].join(' ')}
        >
          {/* 标题栏 */}
          <div
            className={[
              'flex items-center justify-between',
              'px-6 pt-6 pb-4',
              'border-b border-[rgba(172,179,183,0.15)]',
            ].join(' ')}
          >
            <Dialog.Title
              className="font-display text-lg font-semibold text-[var(--text)]"
            >
              {t('bucketSettings.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className={[
                  'flex h-8 w-8 items-center justify-center',
                  'rounded-xl',
                  'text-[var(--text-secondary)]',
                  'hover:bg-[var(--bg-raised)]',
                  'hover:text-[var(--text)]',
                  'transition-all duration-150',
                  'active:scale-90',
                ].join(' ')}
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* 无可用功能时的提示 */}
          {availableTabs.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-6">
              <p className="text-sm text-[var(--text-secondary)]">
                {t('bucketSettings.noFeatures')}
              </p>
            </div>
          ) : (
            <>
              {/* Tab 导航 */}
              <div className="flex gap-1 px-6 pt-4 pb-2">
                {availableTabs.map((td) => (
                  <button
                    key={td.key}
                    type="button"
                    onClick={() => setActiveTab(td.key)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-2',
                      'text-xs rounded-xl transition-all duration-200',
                      activeTab === td.key
                        ? 'bg-[var(--bg-raised)] font-semibold text-[var(--text)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]',
                    ].join(' ')}
                  >
                    {td.icon}
                    {t(`bucketSettings.${td.key}`)}
                  </button>
                ))}
              </div>

              {/* Tab 内容 */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {activeTab === 'lifecycle' && (
                  <LifecycleTab accountId={accountId} bucket={bucket} />
                )}
                {activeTab === 'cors' && (
                  <CORSTab accountId={accountId} bucket={bucket} />
                )}
                {activeTab === 'referer' && (
                  <RefererTab accountId={accountId} bucket={bucket} />
                )}
                {activeTab === 'encryption' && (
                  <EncryptionTab accountId={accountId} bucket={bucket} />
                )}
                {activeTab === 'versioning' && (
                  <VersioningTab accountId={accountId} bucket={bucket} />
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---- Tab 子组件 Props ----
interface TabProps {
  accountId: string;
  bucket: string;
}

// ---- Lifecycle Tab ----

function LifecycleTab({ accountId, bucket }: TabProps) {
  const { t } = useTranslation();
  const query = useLifecycleRulesQuery(accountId, bucket, true);
  const putMutation = usePutLifecycleRulesMutation();
  const deleteMutation = useDeleteLifecycleRulesMutation();

  const [rules, setRules] = useState<LifecycleRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formPrefix, setFormPrefix] = useState('');
  const [formExpiration, setFormExpiration] = useState('30');

  useEffect(() => {
    if (query.data) setRules(query.data);
  }, [query.data]);

  const handleAdd = useCallback(() => {
    const newRule: LifecycleRule = {
      id: `rule-${Date.now()}`,
      prefix: formPrefix,
      enabled: true,
      expiration: parseInt(formExpiration, 10) || 30,
    };
    const updated = [...rules, newRule];
    setRules(updated);
    putMutation.mutate({ accountId, bucket, rules: updated });
    setShowForm(false);
    setFormPrefix('');
    setFormExpiration('30');
  }, [accountId, bucket, formPrefix, formExpiration, rules, putMutation]);

  const handleDelete = useCallback(
    (id: string) => {
      const updated = rules.filter((r) => r.id !== id);
      setRules(updated);
      if (updated.length === 0) {
        deleteMutation.mutate({ accountId, bucket });
      } else {
        putMutation.mutate({ accountId, bucket, rules: updated });
      }
    },
    [accountId, bucket, rules, putMutation, deleteMutation],
  );

  const toggleEnabled = useCallback(
    (id: string) => {
      const updated = rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r,
      );
      setRules(updated);
      putMutation.mutate({ accountId, bucket, rules: updated });
    },
    [accountId, bucket, rules, putMutation],
  );

  if (query.isLoading) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {/* 规则列表 */}
      {rules.length > 0 ? (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={[
                'flex items-center justify-between',
                'rounded-xl bg-[var(--bg-raised)] px-4 py-3',
                'transition-all duration-250',
                'hover:shadow-lg hover:scale-[1.01]',
              ].join(' ')}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">
                    {rule.prefix || '/'}
                  </span>
                  <span
                    className={[
                      'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      rule.enabled
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-[var(--bg-raised)] text-[var(--text-secondary)]',
                    ].join(' ')}
                  >
                    {rule.enabled ? t('bucketSettings.enabled') : t('bucketSettings.disabled')}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('bucketSettings.expiration')}: {rule.expiration} {t('bucketSettings.days')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleEnabled(rule.id)}
                >
                  {rule.enabled ? t('bucketSettings.disabled') : t('bucketSettings.enabled')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => handleDelete(rule.id)}
                >
                  <Trash2 size={14} className="text-[var(--danger)]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('bucketSettings.noFeatures').replace(
            /governance features.*/,
            'lifecycle rules configured',
          )}
        </p>
      )}

      {/* 添加表单 */}
      {showForm ? (
        <div className="space-y-3 rounded-xl bg-[var(--bg-raised)] p-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t('bucketSettings.prefix')}
            </label>
            <Input
              value={formPrefix}
              onChange={(e) => setFormPrefix(e.target.value)}
              placeholder="images/"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t('bucketSettings.expiration')}
            </label>
            <Input
              type="number"
              value={formExpiration}
              onChange={(e) => setFormExpiration(e.target.value)}
              placeholder="30"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              loading={putMutation.isPending}
            >
              {t('bucketSettings.saveRules')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" />
          {t('bucketSettings.addRule')}
        </Button>
      )}
    </div>
  );
}

// ---- CORS Tab ----

function CORSTab({ accountId, bucket }: TabProps) {
  const { t } = useTranslation();
  const query = useCORSRulesQuery(accountId, bucket, true);
  const putMutation = usePutCORSRulesMutation();

  const [rules, setRules] = useState<CORSRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formOrigins, setFormOrigins] = useState('*');
  const [formMethods, setFormMethods] = useState('GET,POST,PUT');
  const [formHeaders, setFormHeaders] = useState('*');
  const [formMaxAge, setFormMaxAge] = useState('3600');

  useEffect(() => {
    if (query.data) setRules(query.data);
  }, [query.data]);

  const handleAdd = useCallback(() => {
    const newRule: CORSRule = {
      allowedOrigins: formOrigins.split(',').map((s) => s.trim()).filter(Boolean),
      allowedMethods: formMethods.split(',').map((s) => s.trim()).filter(Boolean),
      allowedHeaders: formHeaders.split(',').map((s) => s.trim()).filter(Boolean),
      maxAgeSeconds: parseInt(formMaxAge, 10) || 3600,
    };
    const updated = [...rules, newRule];
    setRules(updated);
    putMutation.mutate({ accountId, bucket, rules: updated });
    setShowForm(false);
    setFormOrigins('*');
    setFormMethods('GET,POST,PUT');
    setFormHeaders('*');
    setFormMaxAge('3600');
  }, [accountId, bucket, formOrigins, formMethods, formHeaders, formMaxAge, rules, putMutation]);

  const handleDeleteRule = useCallback(
    (index: number) => {
      const updated = rules.filter((_, i) => i !== index);
      setRules(updated);
      putMutation.mutate({ accountId, bucket, rules: updated });
    },
    [accountId, bucket, rules, putMutation],
  );

  if (query.isLoading) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {rules.map((rule, idx) => (
        <div
          key={idx}
          className={[
            'rounded-xl bg-[var(--bg-raised)] px-4 py-3',
            'transition-all duration-250',
            'hover:shadow-lg hover:scale-[1.01]',
          ].join(' ')}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="font-bold uppercase tracking-wide">
                  {t('bucketSettings.allowedOrigins')}:
                </span>{' '}
                {rule.allowedOrigins.join(', ')}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="font-bold uppercase tracking-wide">
                  {t('bucketSettings.allowedMethods')}:
                </span>{' '}
                {rule.allowedMethods.join(', ')}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="font-bold uppercase tracking-wide">
                  {t('bucketSettings.maxAge')}:
                </span>{' '}
                {rule.maxAgeSeconds}s
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => handleDeleteRule(idx)}
            >
              <Trash2 size={14} className="text-[var(--danger)]" />
            </Button>
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="space-y-3 rounded-xl bg-[var(--bg-raised)] p-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t('bucketSettings.allowedOrigins')}
            </label>
            <Input
              value={formOrigins}
              onChange={(e) => setFormOrigins(e.target.value)}
              placeholder="*, https://example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t('bucketSettings.allowedMethods')}
            </label>
            <Input
              value={formMethods}
              onChange={(e) => setFormMethods(e.target.value)}
              placeholder="GET,POST,PUT"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t('bucketSettings.allowedHeaders')}
            </label>
            <Input
              value={formHeaders}
              onChange={(e) => setFormHeaders(e.target.value)}
              placeholder="*"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t('bucketSettings.maxAge')}
            </label>
            <Input
              type="number"
              value={formMaxAge}
              onChange={(e) => setFormMaxAge(e.target.value)}
              placeholder="3600"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              loading={putMutation.isPending}
            >
              {t('bucketSettings.saveRules')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" />
          {t('bucketSettings.addRule')}
        </Button>
      )}
    </div>
  );
}

// ---- Referer Tab ----

function RefererTab({ accountId, bucket }: TabProps) {
  const { t } = useTranslation();
  const query = useRefererConfigQuery(accountId, bucket, true);
  const putMutation = usePutRefererConfigMutation();

  const [config, setConfig] = useState<RefererConfig>({
    enabled: false,
    type: 'whitelist',
    allowEmpty: true,
    referers: [],
  });
  const [newReferer, setNewReferer] = useState('');

  useEffect(() => {
    if (query.data) setConfig(query.data);
  }, [query.data]);

  const save = useCallback(
    (updated: RefererConfig) => {
      setConfig(updated);
      putMutation.mutate({ accountId, bucket, config: updated });
    },
    [accountId, bucket, putMutation],
  );

  const handleAddReferer = useCallback(() => {
    if (!newReferer.trim()) return;
    save({ ...config, referers: [...config.referers, newReferer.trim()] });
    setNewReferer('');
  }, [config, newReferer, save]);

  const handleRemoveReferer = useCallback(
    (index: number) => {
      save({ ...config, referers: config.referers.filter((_, i) => i !== index) });
    },
    [config, save],
  );

  if (query.isLoading) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {/* 启用开关 */}
      <div className="flex items-center justify-between rounded-xl bg-[var(--bg-raised)] px-4 py-3">
        <span className="text-sm text-[var(--text)]">{t('bucketSettings.enabled')}</span>
        <button
          type="button"
          onClick={() => save({ ...config, enabled: !config.enabled })}
          className={[
            'relative h-6 w-11 rounded-full transition-colors duration-200',
            config.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg)]',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
              config.enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>

      {/* 类型选择 */}
      <div className="rounded-xl bg-[var(--bg-raised)] px-4 py-3">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
          {t('bucketSettings.whitelist')} / {t('bucketSettings.blacklist')}
        </label>
        <div className="flex gap-2">
          {(['whitelist', 'blacklist'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => save({ ...config, type: v })}
              className={[
                'flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-150',
                config.type === v
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              {t(`bucketSettings.${v}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 允许空 Referer */}
      <div className="flex items-center justify-between rounded-xl bg-[var(--bg-raised)] px-4 py-3">
        <span className="text-sm text-[var(--text)]">{t('bucketSettings.allowEmpty')}</span>
        <button
          type="button"
          onClick={() => save({ ...config, allowEmpty: !config.allowEmpty })}
          className={[
            'relative h-6 w-11 rounded-full transition-colors duration-200',
            config.allowEmpty ? 'bg-[var(--accent)]' : 'bg-[var(--bg)]',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
              config.allowEmpty ? 'translate-x-[22px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Referer 列表 */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
          {t('bucketSettings.refererList')}
        </label>
        {config.referers.map((ref, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-xl bg-[var(--bg-raised)] px-4 py-2"
          >
            <span className="text-sm text-[var(--text)]">{ref}</span>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => handleRemoveReferer(idx)}
            >
              <Trash2 size={14} className="text-[var(--danger)]" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={newReferer}
            onChange={(e) => setNewReferer(e.target.value)}
            placeholder="*.example.com"
            onKeyDown={(e) => e.key === 'Enter' && handleAddReferer()}
          />
          <Button variant="secondary" size="sm" onClick={handleAddReferer}>
            <Plus size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Encryption Tab ----

function EncryptionTab({ accountId, bucket }: TabProps) {
  const { t } = useTranslation();
  const query = useEncryptionQuery(accountId, bucket, true);
  const putMutation = usePutEncryptionMutation();

  const [config, setConfig] = useState<EncryptionConfig>({
    enabled: false,
    algorithm: 'AES256',
  });

  useEffect(() => {
    if (query.data) setConfig(query.data);
  }, [query.data]);

  const save = useCallback(
    (updated: EncryptionConfig) => {
      setConfig(updated);
      putMutation.mutate({ accountId, bucket, config: updated });
    },
    [accountId, bucket, putMutation],
  );

  if (query.isLoading) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {/* 启用开关 */}
      <div className="flex items-center justify-between rounded-xl bg-[var(--bg-raised)] px-4 py-3">
        <span className="text-sm text-[var(--text)]">{t('bucketSettings.enabled')}</span>
        <button
          type="button"
          onClick={() => save({ ...config, enabled: !config.enabled })}
          className={[
            'relative h-6 w-11 rounded-full transition-colors duration-200',
            config.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg)]',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
              config.enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>

      {/* 算法选择 */}
      <div className="rounded-xl bg-[var(--bg-raised)] px-4 py-3">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
          {t('bucketSettings.algorithm')}
        </label>
        <Select
          value={config.algorithm}
          onChange={(v) => save({ ...config, algorithm: v })}
          options={[
            { value: 'AES256', label: 'AES256' },
            { value: 'aws:kms', label: 'AWS KMS' },
          ]}
        />
      </div>
    </div>
  );
}

// ---- Versioning Tab ----

function VersioningTab({ accountId, bucket }: TabProps) {
  const { t } = useTranslation();
  const query = useVersioningQuery(accountId, bucket, true);
  const putMutation = usePutVersioningMutation();

  const status = query.data ?? 'Suspended';
  const isEnabled = status === 'Enabled';

  const toggle = useCallback(() => {
    const next = isEnabled ? 'Suspended' : 'Enabled';
    putMutation.mutate({ accountId, bucket, status: next });
  }, [accountId, bucket, isEnabled, putMutation]);

  if (query.isLoading) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {/* 状态显示 */}
      <div className="flex items-center justify-between rounded-xl bg-[var(--bg-raised)] px-4 py-3">
        <div className="space-y-1">
          <span className="text-sm font-medium text-[var(--text)]">
            {t('bucketSettings.versioning')}
          </span>
          <p className="text-xs text-[var(--text-secondary)]">
            {isEnabled
              ? t('bucketSettings.versioningEnabled')
              : t('bucketSettings.versioningSuspended')}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={putMutation.isPending}
          className={[
            'relative h-6 w-11 rounded-full transition-colors duration-200',
            isEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg)]',
            putMutation.isPending ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
              isEnabled ? 'translate-x-[22px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  );
}
