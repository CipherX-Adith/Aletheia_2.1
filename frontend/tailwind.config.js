/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#070b14',
          surface: '#0d1526',
          elevated: '#121f38',
          card: '#162240',
          hover: '#1a2a4e',
        },
        brand: {
          primary: '#3b82f6',
          secondary: '#6366f1',
          accent: '#0ea5e9',
        },
        stellar: {
          DEFAULT: '#7c3aed',
          light: 'rgba(124, 58, 237, 0.15)',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        lg: '16px',
        md: '10px',
        sm: '6px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(59, 130, 246, 0.2)',
        'glow-strong': '0 0 40px rgba(59, 130, 246, 0.35)',
      }
    },
  },
  plugins: [],
}
