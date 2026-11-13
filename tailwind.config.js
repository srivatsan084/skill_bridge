/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#b9d5ff',
          300: '#7cb2fe',
          400: '#3988f8',
          500: '#1465e9',
          600: '#094ac8',
          700: '#0a3ba0',
          800: '#0e3482',
          900: '#112d6a',
          navy: '#0B1528',
          deep: '#0F172A',
        },
        accent: {
          purple: '#6366F1',
          violet: '#8B5CF6',
          teal: '#0D9488',
          emerald: '#10B981',
          amber: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
