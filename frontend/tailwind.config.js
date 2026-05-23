/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d',
        card: '#1a1a1a',
        border: '#2a2a2a',
        accent: '#6c63ff',
        'accent-hover': '#5a52e8',
        muted: '#888888',
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':        'fade-in 0.2s ease-out',
        'scale-in':       'scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    }
  },
  plugins: []
}
