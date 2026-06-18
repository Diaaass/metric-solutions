import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-plex-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Брендовый navy / корпоративный синий
        primary: {
          50: '#eef4fb',
          100: '#d8e6f5',
          200: '#b3cdeb',
          300: '#84acdb',
          400: '#5285c5',
          500: '#3366ad',
          600: '#234e8c',
          700: '#1b3d6e',
          800: '#152f54',
          900: '#0f2240',
          950: '#0a1830',
        },
        // Металлический (стальной) акцент — по брифу «акцентные металлические оттенки»
        accent: {
          50: '#f4f6f8',
          100: '#e7ebef',
          200: '#d2d9e1',
          300: '#b2bdca',
          400: '#8c9aab',
          500: '#6f7e91',
          600: '#586675',
          700: '#47525f',
          800: '#3a434e',
          900: '#272d35',
        },
        // Холодные нейтрали (slate)
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 34, 64, 0.04), 0 8px 24px -12px rgba(15, 34, 64, 0.12)',
        elevated: '0 12px 40px -16px rgba(15, 34, 64, 0.28)',
      },
      backgroundImage: {
        // Металлический «стальной» отлив для тонких акцентных полос
        metal: 'linear-gradient(90deg, #9aa6b6 0%, #e8edf2 45%, #b7c1cd 70%, #8b96a6 100%)',
        'metal-v': 'linear-gradient(180deg, #b7c1cd 0%, #e8edf2 50%, #9aa6b6 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
