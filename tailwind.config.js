/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '90rem',  
        '9xl': '100rem',
        '10xl': '110rem',
        '11xl': '120rem', 
      },
    },
  },
  plugins: [],
}

