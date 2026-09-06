/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f9fc',
          100: '#e6f0f7',
          200: '#c9dce9',
          300: '#9ebbd0',
          400: '#6e96b3',
          500: '#426d8b',
          600: '#2e526f',
          700: '#1e3b55',
          800: '#11283d',
          900: '#050b12',
        },
        accent: {
          DEFAULT: '#008bd2',
          hover: '#006da8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
