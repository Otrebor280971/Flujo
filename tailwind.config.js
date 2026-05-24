/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        app: {
          bg: '#0B0F14',
          surface: '#11161D',
          elevated: '#151B23',
          border: 'rgba(255,255,255,0.06)',
        },

        finance: {
          available: '#67E8F9',
          cash: '#86EFAC',
          investment: '#C4B5FD',
          debt: '#FB7185',
          warning: '#FCD34D',
          danger: '#F87171',
        },
      },

      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.24)',
        glow: '0 0 40px rgba(103,232,249,0.10)',
      },

      borderRadius: {
        '2.5xl': '1.35rem',
      },

      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },

  plugins: [],
}