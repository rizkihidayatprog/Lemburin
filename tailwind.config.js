/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf0ef',
          100: '#fbddd9',
          200: '#f6bcb4',
          300: '#ec8d80',
          400: '#df5a4c',
          500: '#ce3427',
          600: '#be2418',
          700: '#a01a12',
          800: '#821a14',
          900: '#6b1a15',
          950: '#4a0e0a',
        },
        indonesia: '#ce1126',
        gold: {
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(74, 14, 10, 0.08)',
        glow: '0 0 0 2px rgba(250, 204, 21, 0.6)',
      },
    },
  },
  plugins: [],
}
