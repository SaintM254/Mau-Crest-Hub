/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'var(--cream)',
        paper: 'var(--paper)',
        'cream-deep': 'var(--cream-deep)',
        sand: 'var(--sand)',
        forest: 'var(--forest)',
        'forest-dark': 'var(--forest-dark)',
        'forest-tint': 'var(--forest-tint)',
        gold: 'var(--gold)',
        'gold-dark': '#8A6414',
        'gold-tint': 'var(--gold-tint)',
        'deep-blue': 'var(--deep-blue)',
        'blue-tint': 'var(--blue-tint)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        danger: 'var(--danger)',
        'danger-tint': 'var(--danger-tint)',
        warning: 'var(--warning)',
        'warning-tint': 'var(--warning-tint)'
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
