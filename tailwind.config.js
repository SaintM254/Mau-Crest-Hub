/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'rgb(var(--cream) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        'cream-deep': 'rgb(var(--cream-deep) / <alpha-value>)',
        sand: 'rgb(var(--sand) / <alpha-value>)',
        forest: 'rgb(var(--forest) / <alpha-value>)',
        'forest-dark': 'rgb(var(--forest-dark) / <alpha-value>)',
        'forest-tint': 'rgb(var(--forest-tint) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        'gold-dark': '#8A6414',
        'gold-tint': 'rgb(var(--gold-tint) / <alpha-value>)',
        'deep-blue': 'rgb(var(--deep-blue) / <alpha-value>)',
        'blue-tint': 'rgb(var(--blue-tint) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'danger-tint': 'rgb(var(--danger-tint) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        'warning-tint': 'rgb(var(--warning-tint) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Public Sans', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        input: '6px',
        panel: '10px',
        dialog: '12px'
      }
    }
  },
  plugins: []
};
