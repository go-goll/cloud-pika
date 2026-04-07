/**
 * 简易 toast 通知工具
 * 通过 DOM 直接创建通知元素，无需额外依赖
 */

type ToastType = 'success' | 'error' | 'info';

const DURATION = 3000;

function getContainer(): HTMLElement {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = [
      'position:fixed',
      'top:16px',
      'right:16px',
      'z-index:9999',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(container);
  }
  return container;
}

function getTypeStyles(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'background:var(--success);color:#fff';
    case 'error':
      return 'background:var(--danger);color:#fff';
    case 'info':
      return 'background:var(--surface-high);color:var(--text)';
  }
}

function show(message: string, type: ToastType): void {
  const container = getContainer();
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = [
    getTypeStyles(type),
    'padding:8px 16px',
    'border-radius:var(--radius)',
    'font-size:13px',
    'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
    'pointer-events:auto',
    'opacity:0',
    'transform:translateX(20px)',
    'transition:opacity 200ms,transform 200ms',
  ].join(';');

  container.appendChild(el);

  // 触发入场动画
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';
  });

  // 自动移除
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 200);
  }, DURATION);
}

export const toast = {
  success: (msg: string) => show(msg, 'success'),
  error: (msg: string) => show(msg, 'error'),
  info: (msg: string) => show(msg, 'info'),
};
