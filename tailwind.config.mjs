/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f8ff',
          100: '#e6f0ff',
          200: '#c7ddff',
          300: '#93c0ff',
          400: '#5a9eff',
          500: '#2673ff',
          600: '#1b5ce6',
          700: '#154bb8',
          800: '#11388c',
          900: '#0e2a66',
        },
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
    },
  },
  plugins: [],
}
