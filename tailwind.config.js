/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F1117',
        surface: '#1A1D27',
        elevated: '#22263A',
        border: '#2A2E42',
        p1: '#6C63FF',
        p1light: '#8B85FF',
        p1dim: 'rgba(108,99,255,0.15)',
        p2: '#FF6584',
        p2light: '#FF85A0',
        p2dim: 'rgba(255,101,132,0.15)',
        success: '#2ECC71',
        successdim: 'rgba(46,204,113,0.12)',
        streak: '#FF9F43',
        gold: '#FFD700',
        textprimary: '#EAEAEA',
        textsecondary: '#8A8FA8',
        textdisabled: '#4A4F68',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        tablet: '768px',
      },
    },
  },
  plugins: [],
}
