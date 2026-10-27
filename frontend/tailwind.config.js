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
        night: '#070B14',
        'surface-1': '#0F1626',
        'surface-2': '#151D30',
        'surface-3': '#1D263D',
        'civic-blue': '#3B82F6',
        'civic-blue-hover': '#2563EB',
        'verified-teal': '#2DD4BF',
        'sla-amber': '#F59E0B',
        'alert-red': '#F43F5E',
        'agent-violet': '#A78BFA',
        'text-primary': '#E6EAF2',
        'text-muted': '#8B95A9',
        'text-subtle': '#525D73',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      },
      borderRadius: {
        'card': '14px',
        'inner': '8px',
        'badge': '4px'
      },
      borderColor: {
        hairline: 'rgba(255, 255, 255, 0.08)',
        'hairline-hover': 'rgba(255, 255, 255, 0.18)',
      }
    },
  },
  plugins: [],
}
