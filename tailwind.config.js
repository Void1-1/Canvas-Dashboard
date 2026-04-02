/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.08)',
        cream: '#f5f3ec',
        sand: '#e9e5d8',
        taupe: '#3e3b32',
        accent: '#c89b7b',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}; 