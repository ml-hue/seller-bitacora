/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'seller-blue': '#2563eb',
        'seller-blue-dark': '#1d4ed8',
        'seller-blue-light': '#dbeafe',
      }
    },
  },
  plugins: [],
}