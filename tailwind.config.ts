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
        'surface-container-lowest':
          'var(--color-surface-container-lowest)',
        'surface-high': 'var(--surface-high)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-muted': 'var(--surface-muted)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--color-outline-variant)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        'bg-card': 'var(--bg-card)',
      },
      fontFamily: {
        display: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        headline: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        soft: '16px',
        bento: '24px',
      },
      boxShadow: {
        ambient: '0 24px 64px -12px rgba(0,0,0,0.08), 0 0 12px rgba(0,122,255,0.06)',
        'glow-sm': '0 0 15px rgba(0,122,255,0.15)',
        glow: '0 0 30px rgba(0,122,255,0.2)',
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
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'slide-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
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
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.3s ease-out both',
        'slide-in-right':
          'slide-in-right 0.25s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;

