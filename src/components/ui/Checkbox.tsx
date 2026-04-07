import type { InputHTMLAttributes } from 'react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** 复选框组件，统一主题色 */
export function Checkbox(props: CheckboxProps) {
  return (
    <input
      {...props}
      type="checkbox"
      className={[
        'h-4 w-4 cursor-pointer accent-[var(--primary)]',
        'rounded-sm',
        props.className ?? '',
      ].join(' ')}
    />
  );
}
