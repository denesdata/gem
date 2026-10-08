import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // GEM Brand Colors
        gem: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#9AD864',
          400: '#8BD050', // Light lime green
          500: '#7EC844', // Primary GEM Green
          600: '#5FA832',
          700: '#4A9F31',
          800: '#3D8B70',
          900: '#1B4D5C',
          teal: '#3D8B70', // GEM Teal
          gold: '#ebbc5a', // Gold/Yellow accent
          pink: '#FF70BB', // Pink accent
          purple: '#afa2dc', // Purple accent
          cyan: '#99D9EA', // Cyan accent
          orange: '#ffa349', // Orange accent
        },
        // Dark theme
        dark: {
          bg: '#0a0f14',
          card: '#12181f',
          border: '#1a222b',
          muted: '#2f3a47',
        },
        // Light theme
        light: {
          bg: '#F8FAFA',
          card: '#FFFFFF',
          border: '#E8ECF0',
          muted: '#D1D9E0',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
