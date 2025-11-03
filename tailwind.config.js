module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        viventa: {
          navy: '#0B2545',
          'navy-light': '#134074',
          teal: '#00A676',
          'teal-dark': '#008f5f',
          cyan: '#00A6A6',
          coral: '#FF6B35',
          'coral-light': '#FF8C35',
          // Caribbean-inspired palette
          turquoise: '#1FCECB',
          'turquoise-light': '#67E8E5',
          sunset: '#FF8B5B',
          'sunset-light': '#FFA57D',
          sand: '#F8E5D4',
          'sand-dark': '#E6D4BC',
          ocean: '#2C77BF',
          'ocean-deep': '#1B5A8D',
          palm: '#4CAF79',
          'palm-light': '#6FD99A',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}