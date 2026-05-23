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
      }
    }
  },
  plugins: []
}
