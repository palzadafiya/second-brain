/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        black: {
          600: "#494949"
        },
        beige: {
          400: "#ECE8D9",
          200: "#FAF6E9",
          100: "#FFFDF6"
        }
      }
    },
  },
  plugins: [],
}