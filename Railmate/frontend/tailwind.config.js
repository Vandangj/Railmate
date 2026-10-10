/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#081225',
          navy: '#0B192C',
          slate: '#1E3E62',
          card: '#112239',
          border: '#1F3A5F',
          teal: '#0EA5E9',
          accent: '#0284C7',
          gold: '#EAB308',
          emerald: '#10B981',
          light: '#F8FAFC',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
