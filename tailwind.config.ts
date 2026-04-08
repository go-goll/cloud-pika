import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-foreground': 'var(--on-primary)',
        surface: 'var(--surface)',
        'surface-low': 'var(--surface-low)',
        'surface-high': 'var(--surface-high)',
        outline: 'var(--outline)'
      },
      fontFamily: {
        display: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        ambient: '0 18px 40px rgba(8, 16, 34, 0.32)',
      },
      borderRadius: {
        soft: '12px',
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
        in: 'fade-in 150ms ease-out, zoom-in-95 150ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
