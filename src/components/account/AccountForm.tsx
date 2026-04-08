import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import {
  fieldIsRequired,
  getMissingRequiredField,
  getProviderOption,
  providerOptions,
  type LoginFieldKey,
} from '@/lib/provider';
import type { ProviderKey } from '@/types/account';

interface AccountFormProps {
  isPending: boolean;
  onSubmit: (form: FormState) => Promise<void>;
}

export interface FormState {
  provider: ProviderKey;
  name: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  region: string;
  serviceName: string;
  internal: boolean;
  paging: boolean;
}

const defaultForm: FormState = {
  provider: 'qiniu',
  name: getProviderOption('qiniu').defaultAlias,
  accessKey: '',
  secretKey: '',
  endpoint: '',
  region: '',
  serviceName: '',
  internal: false,
  paging: false,
};

/** 账户创建/连接表单 */
export function AccountForm({
  isPending,
  onSubmit,
}: AccountFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [nameTouched, setNameTouched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const providerMeta = useMemo(
    () => getProviderOption(form.provider),
    [form.provider],
  );

  // 未手动修改别名时，自动跟随云厂商切换
  useEffect(() => {
    if (!nameTouched) {
      setForm((prev) => ({
        ...prev,
        name: providerMeta.defaultAlias,
      }));
    }
  }, [nameTouched, providerMeta.defaultAlias]);

  const showEndpoint =
    fieldIsRequired(providerMeta.endpointMode) ||
    (providerMeta.endpointMode === 'optional' && showAdvanced);
  const showRegion =
    fieldIsRequired(providerMeta.regionMode) ||
    (providerMeta.regionMode === 'optional' && showAdvanced);
  const showInternal =
    providerMeta.showInternal && showAdvanced;

  const canToggleAdvanced =
    providerMeta.endpointMode === 'optional' ||
    providerMeta.regionMode === 'optional' ||
    providerMeta.showInternal;

  /** 获取字段的本地化标签 */
  const getFieldLabel = (field: LoginFieldKey): string => {
    const map: Record<LoginFieldKey, string> = {
      name: t('login.alias'),
      accessKey: t(
        providerMeta.accessKeyLabelKey ?? 'login.accessKey',
      ),
      secretKey: t(
        providerMeta.secretKeyLabelKey ?? 'login.secretKey',
      ),
      serviceName: t('login.serviceName'),
      endpoint: t('login.endpoint'),
      region: t('login.region'),
    };
    return map[field] ?? field;
  };

  /** 更新表单字段的通用方法 */
  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const missing = getMissingRequiredField(form);
    if (missing) {
      setSubmitError(
        t('login.requiredField', {
          field: getFieldLabel(missing),
        }),
      );
      return;
    }

    try {
      setSubmitError('');
      await onSubmit({
        ...form,
        endpoint: form.endpoint.trim(),
        region: form.region.trim(),
        serviceName: form.serviceName.trim(),
      });
    } catch (error) {
      const fallback = t('login.connectFailed');
      if (error instanceof AxiosError) {
        const resp = error.response?.data as
          | {
              error?: string;
              message?: string;
              detail?: string;
            }
          | undefined;
        setSubmitError(
          resp?.message ||
            resp?.error ||
            resp?.detail ||
            error.message ||
            fallback,
        );
      } else if (error instanceof Error) {
        setSubmitError(error.message || fallback);
      } else {
        setSubmitError(fallback);
      }
    }
  };

  /** 云厂商切换处理 */
  const handleProviderChange = (next: ProviderKey) => {
    const nextMeta = getProviderOption(next);
    setShowAdvanced(false);
    setSubmitError('');
    setForm((prev) => ({
      ...prev,
      provider: next,
      name: nameTouched ? prev.name : nextMeta.defaultAlias,
      serviceName:
        nextMeta.serviceNameMode === 'hidden'
          ? ''
          : prev.serviceName,
      endpoint:
        nextMeta.endpointMode === 'hidden'
          ? ''
          : prev.endpoint,
      region:
        nextMeta.regionMode === 'hidden' ? '' : prev.region,
      internal: nextMeta.showInternal
        ? prev.internal
        : false,
    }));
  };

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-2xl font-semibold">
        {t('login.title')}
      </h1>
      <p className="text-sm text-[var(--text-muted)]">
        {t('login.subtitle')}
      </p>

      {/* 云厂商选择 */}
      <label className="text-sm">
        <span className="mb-2 block text-[var(--text-muted)]">
          {t('login.provider')}
        </span>
        <Select
          value={form.provider}
          onChange={(value) =>
            handleProviderChange(value as ProviderKey)
          }
          options={providerOptions}
        />
      </label>

      {/* 别名 */}
      <label className="text-sm">
        <span className="mb-2 block text-[var(--text-muted)]">
          {t('login.alias')}
        </span>
        <Input
          value={form.name}
          onChange={(e) => {
            setNameTouched(true);
            updateField('name', e.target.value);
          }}
        />
      </label>

      {/* AccessKey */}
      <label className="text-sm">
        <span className="mb-2 block text-[var(--text-muted)]">
          {t(
            providerMeta.accessKeyLabelKey ??
              'login.accessKey',
          )}
        </span>
        <Input
          value={form.accessKey}
          onChange={(e) =>
            updateField('accessKey', e.target.value)
          }
        />
      </label>

      {/* SecretKey（密码模式） */}
      <label className="text-sm">
        <span className="mb-2 block text-[var(--text-muted)]">
          {t(
            providerMeta.secretKeyLabelKey ??
              'login.secretKey',
          )}
        </span>
        <Input
          type="password"
          value={form.secretKey}
          onChange={(e) =>
            updateField('secretKey', e.target.value)
          }
        />
      </label>

      {/* 服务名称（仅部分厂商显示） */}
      {providerMeta.serviceNameMode !== 'hidden' ? (
        <label className="text-sm">
          <span className="mb-2 block text-[var(--text-muted)]">
            {t('login.serviceName')}
          </span>
          <Input
            value={form.serviceName}
            onChange={(e) =>
              updateField('serviceName', e.target.value)
            }
            placeholder={t('login.serviceNamePlaceholder')}
          />
        </label>
      ) : null}

      {/* 高级选项折叠按钮 */}
      {canToggleAdvanced ? (
        <button
          type="button"
          className={[
            'flex w-fit items-center gap-1 text-xs',
            'text-[var(--text-muted)]',
            'underline-offset-4 hover:underline',
          ].join(' ')}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced
            ? t('login.hideAdvanced')
            : t('login.showAdvanced')}
          {showAdvanced ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )}
        </button>
      ) : null}

      {/* 高级配置区域 */}
      {showEndpoint || showRegion || showInternal ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {showEndpoint ? (
            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">
                {t('login.endpoint')}
              </span>
              <Input
                value={form.endpoint}
                onChange={(e) =>
                  updateField('endpoint', e.target.value)
                }
                placeholder={t('login.endpointPlaceholder')}
              />
            </label>
          ) : null}
          {showRegion ? (
            <label className="text-sm">
              <span className="mb-2 block text-[var(--text-muted)]">
                {t('login.region')}
              </span>
              <Input
                value={form.region}
                onChange={(e) =>
                  updateField('region', e.target.value)
                }
                placeholder={t('login.regionPlaceholder')}
              />
            </label>
          ) : null}
          {showInternal ? (
            <label
              className={[
                'col-span-full flex items-center gap-2',
                'text-sm text-[var(--text-muted)]',
              ].join(' ')}
            >
              <Checkbox
                checked={form.internal}
                onCheckedChange={(checked) =>
                  updateField('internal', checked)
                }
              />
              {t('login.internal')}
            </label>
          ) : null}
        </div>
      ) : null}

      {/* 提交按钮 */}
      <div className="pt-2">
        <Button
          className="w-full"
          onClick={() => void handleSubmit()}
          disabled={isPending}
        >
          {isPending ? (
            <Spinner size="sm" className="mr-2" />
          ) : null}
          {t('login.connect')}
        </Button>
        {submitError ? (
          <p className="mt-2 text-xs text-[var(--danger)]">
            {submitError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
