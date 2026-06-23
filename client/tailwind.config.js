/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: '#f0b90b',
        card: 'var(--card)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        foreground: 'var(--foreground)',
        background: 'var(--background)',
      },
    },
  },
  plugins: [],
};
