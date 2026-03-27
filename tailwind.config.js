/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111111',
        secondary: '#FFFFFF',
        accent: '#C6A769',
        bgLight: '#F8F8F8',
        textGrey: '#666666',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'luxury': '30px',
      },
    },
  },
  plugins: [],
}
