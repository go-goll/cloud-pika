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
    },
  },
  plugins: [],
} satisfies Config;
