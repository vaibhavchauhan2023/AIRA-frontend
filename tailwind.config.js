/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add your new colors and fonts here
      colors: {
        'main-blue': '#2264E9',
        'light-blue': '#EBF4FF',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'], // Sets Inter as the default font
        'poppins': ['Poppins', 'sans-serif'] // Adds Poppins as a utility font
      }
    },
  },
  plugins: [],
}