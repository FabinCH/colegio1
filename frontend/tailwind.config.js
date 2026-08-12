/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue:   '#2563eb',
          blueDark: '#1e40af',
          yellow: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
