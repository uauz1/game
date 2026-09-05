/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#07090d',
          50: '#f3f4f6',
          100: '#e5e7eb',
          200: '#cbd0d8',
          300: '#9ca3af',
          400: '#6b7280',
          500: '#3f4652',
          600: '#272c35',
          700: '#171b22',
          800: '#0d1016',
          900: '#07090d',
        },
        purple: {
          DEFAULT: '#f6b94f',
          light: '#ffd477',
          dark: '#d99528',
        },
        yellow: {
          DEFAULT: '#f6b94f',
          light: '#ffd477',
          dark: '#d99528',
        },
        coral: {
          DEFAULT: '#ef6461',
          light: '#ff8583',
          dark: '#cf4744',
        },
        turquoise: {
          DEFAULT: '#f4c66f',
          light: '#ffe09d',
          dark: '#c9912f',
        },
        'off-white': '#f7f4ee',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        'glow-purple': '0 0 34px rgba(246, 185, 79, 0.22)',
        'glow-yellow': '0 0 34px rgba(246, 185, 79, 0.26)',
        'glow-coral': '0 0 28px rgba(239, 100, 97, 0.24)',
        'glow-turquoise': '0 0 28px rgba(244, 198, 111, 0.20)',
        'soft': '0 16px 45px rgba(0, 0, 0, 0.26)',
        'card': '0 18px 50px rgba(0, 0, 0, 0.30)',
      },
      keyframes: {},
      animation: {},
    },
  },
  plugins: [],
};