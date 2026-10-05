/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6', // Warna ungu tema wedding
        surface: '#ffffff',
        darksurface: '#1f2937',
      }
    },
  },
  plugins: [],
}