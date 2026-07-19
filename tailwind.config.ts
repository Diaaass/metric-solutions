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
        display: ['var(--font-display)', 'Oswald', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        card: ['var(--font-card)', 'Montserrat', 'sans-serif'],
      },
      colors: {
        // Базовый тёмно-синий фон (из макета #001a3d)
        ink: {
          950: '#001a3d',
          900: '#02234d',
          800: '#042147',
          700: '#0a2f5c',
          600: '#123a6b',
        },
        // Синий акцент (#0088ff → #005299)
        accent: {
          50: '#e6f2ff',
          100: '#cce4ff',
          200: '#99c9ff',
          300: '#5aa9ff',
          400: '#3391ff',
          500: '#0088ff',
          600: '#0070d6',
          700: '#005299',
          800: '#003d73',
          900: '#00284d',
        },
        secondary: {
          50: '#f4f7fb',
          100: '#e6ecf5',
          200: '#c9d5e8',
          300: '#9fb1ce',
          400: '#7488a8',
          500: '#556785',
          600: '#3f4f6a',
          700: '#2c384d',
          800: '#1a2434',
          900: '#0f1622',
        },
      },
      backgroundImage: {
        'blue-grad': 'linear-gradient(90deg, #0088ff 0%, #005299 100%)',
      },
      boxShadow: {
        glow: '0px 13px 50px 0px rgba(26,104,255,0.30)',
        // Свечение карточек из макета (#05335f, многослойное)
        'card-glow':
          '0 0 69px #05335f, 0 0 39px #05335f, 0 0 23px #05335f, 0 0 11px #05335f, 0 0 3px #05335f',
      },
      dropShadow: {
        // Свечение иконок из макета
        icon: [
          '0 0 18.9px #0084ff',
          '0 0 10.8px #0084ff',
          '0 0 6.3px #0084ff',
          '0 0 3.1px #0084ff',
        ],
      },
    },
  },
  plugins: [],
};
export default config;
