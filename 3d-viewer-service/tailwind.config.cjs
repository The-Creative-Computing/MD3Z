/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#5ce6ac',
          main: '#0b9444',
          dark: '#0a2920',
          active: '#34fd8c',
        },
        m3dz: {
          green: '#0b9444',
          light: '#34FD8C',
          hover: 'rgba(52, 253, 140, 0.2)',
        }
      }
    },
  },
  plugins: [],
}
