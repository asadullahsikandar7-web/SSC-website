/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: '#173D35',
        ivory: '#F7F2E8',
        gold: '#C5A45D',
        maroon: '#762F40',
        charcoal: '#26332F',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(23, 61, 53, 0.12)',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
