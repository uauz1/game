/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#101735',
          50: '#e8ebf5',
          100: '#c4cbe6',
          200: '#9aa9d2',
          300: '#6f7bb8',
          400: '#4a5a99',
          500: '#2e3d72',
          600: '#1f2a54',
          700: '#17203f',
          800: '#101735',
          900: '#0a0e24',
        },
        purple: {
          DEFAULT: '#7056E8',
          light: '#8b73f0',
          dark: '#5a3fd0',
        },
        yellow: {
          DEFAULT: '#FFC83D',
          light: '#ffd96b',
          dark: '#e6b020',
        },
        coral: {
          DEFAULT: '#FF625F',
          light: '#ff8583',
          dark: '#e6403d',
        },
        turquoise: {
          DEFAULT: '#35D1C5',
          light: '#5cddd3',
          dark: '#21b0a6',
        },
        'off-white': '#F7F7FB',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(112, 86, 232, 0.4)',
        'glow-yellow': '0 0 30px rgba(255, 200, 61, 0.4)',
        'glow-coral': '0 0 30px rgba(255, 98, 95, 0.4)',
        'glow-turquoise': '0 0 30px rgba(53, 209, 197, 0.4)',
        'soft': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      keyframes: {},
      animation: {},
    },
  },
  plugins: [],
};
