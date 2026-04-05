import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-soft)_100%)] text-[var(--on-primary)] shadow-[0_8px_30px_var(--primary-glow)]',
  secondary: 'bg-[var(--surface-elevated)] text-[var(--text)]',
  ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
  danger: 'bg-[color-mix(in_srgb,var(--danger)_84%,black)] text-white',
};

export function Button({
  children,
  className,
  variant = 'primary',
  type = 'button',
  ...rest
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      className={[
        'inline-flex h-9 items-center justify-center rounded-[var(--radius)] px-4 text-sm font-medium transition-all duration-200',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
