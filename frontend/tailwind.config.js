/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F8F4E9',
          100: '#F6F0DE',
          200: '#F3EBD8',
          300: '#D8C9A7',
          400: '#C3A66B',
          500: '#494431',
          600: '#373124',
          700: '#2A261C',
          800: '#1D1C17',
          900: '#171715',
          950: '#0F0F0E',
        },
        secondary: {
          50: '#F8F4E9',
          100: '#F3EBD8',
          200: '#E7DCC2',
          300: '#D8C9A7',
          400: '#C3A66B',
          500: '#8F7A4D',
          600: '#494431',
          700: '#373124',
          800: '#27241B',
          900: '#171715',
        },
        ivory: {
          50: '#F8F4E9',
          100: '#F6F0DE',
          200: '#F3EBD8',
          300: '#D8C9A7',
        },
        charcoal: '#171715',
        olive: '#494431',
        champagne: '#C3A66B',
        beige: '#D8C9A7',
        ink: '#373124',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
