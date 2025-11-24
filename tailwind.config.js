/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          surface: '#0f1115',
          accent: '#181b21',
          control: '#1f232b',
        },
      },
    },
  },
  plugins: [],
}

