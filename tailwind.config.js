/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}", // Include all pages
    "./components/**/*.{js,ts,jsx,tsx}", // Include all components
    "./app/**/*.{js,ts,jsx,tsx}", // Include app directory (if using Next.js App Router)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};