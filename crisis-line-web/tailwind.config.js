/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        brand: {
          50: '#fff7f5',
          100: '#ffe4df',
          200: '#ffd0c7',
          300: '#ffb3a6',
          400: '#ff9d8d',
          500: '#F1917b',
          600: '#e07f6e',
          700: '#c96f61',
          800: '#a95a4d',
          900: '#7a3d32',
        },
        softpink: {
          50: '#fff8f6',
          100: '#fff0ec',
          200: '#ffeae5',
          300: '#ffd6cc',
        },
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        white: '#ffffff',
        success: '#7ed6a7',
        warning: '#ffe29a',
        danger: '#ffb4a2',
        info: '#b5d8f8',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} 