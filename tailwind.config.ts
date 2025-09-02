import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'pulse': 'pulse 0.5s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'spin': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        pulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0.4)' },
          '50%': { boxShadow: '0 0 0 4px rgba(255, 107, 107, 0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;