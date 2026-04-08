import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-container': 'var(--color-primary-container)',
        'primary-foreground': 'var(--color-on-primary)',
        'on-primary': 'var(--color-on-primary)',
        surface: 'var(--color-surface)',
        'surface-low': 'var(--color-surface-container-low)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-high': 'var(--surface-high)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-muted': 'var(--surface-muted)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--color-outline-variant)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
      fontFamily: {
        display: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        headline: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        soft: '12px',
      },
      boxShadow: {
        ambient: [
          '0 32px 48px -4px rgba(0,103,130,0.06)',
          '0 8px 16px -2px rgba(0,103,130,0.04)',
        ].join(', '),
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in-95': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'fade-in': 'fade-in 150ms ease-out',
        'zoom-in-95': 'zoom-in-95 150ms ease-out',
        in: [
          'fade-in 150ms ease-out',
          'zoom-in-95 150ms ease-out',
        ].join(', '),
      },
    },
  },
  plugins: [],
} satisfies Config;
