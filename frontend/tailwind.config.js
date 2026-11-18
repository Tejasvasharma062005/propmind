/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f6f3',
          100: '#e1ebe4',
          200: '#c5d7cb',
          300: '#9cbba7',
          400: '#6f987e',
          500: '#4c795e',
          600: '#1b3126',
          700: '#16281f',
          800: '#122119',
          900: '#0e1a14',
          950: '#09110d',
        },
        secondary: {
          50: '#f4f7f5',
          100: '#e6ede8',
          200: '#cfddd3',
          300: '#adc4b4',
          400: '#84a48e',
          500: '#658570',
          600: '#4e6b58',
          700: '#405648',
          800: '#35473c',
          900: '#2d3b32',
        },
        champagne: {
          50: '#fbf8f1',
          100: '#f5eedc',
          200: '#eadab8',
          300: '#dcc18e',
          400: '#cfa968',
          500: '#c4954c',
          600: '#ae7c3c',
          700: '#8d6032',
          800: '#744e2e',
          900: '#614129',
        },
        ivory: {
          50: '#fdfcfa',
          100: '#faf7f2',
          200: '#f3efe6',
          300: '#e6e0d3',
          400: '#d5ccb9',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
