/**
 * Tailwind 3 memuat berkas konfigurasi ini lewat CommonJS. Karena package.json
 * memakai "type": "module", konfigurasi harus berformat .cjs dengan
 * module.exports — bila tidak, Tailwind gagal memuatnya diam-diam dan seluruh
 * token warna di bawah ini hilang.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet permadani ("tapestry") — sengaja dipilih agar tidak jatuh ke
        // ungu-standar-Tailwind yang dipakai semua template.
        canvas: {
          DEFAULT: '#faf7f4',
          card: '#ffffff',
          sunken: '#f3ede7',
        },
        ink: {
          DEFAULT: '#1c1917',
          muted: '#78716c',
          faint: '#a8a29e',
        },
        line: {
          DEFAULT: '#ebe4dd',
          strong: '#ddd3c9',
        },
        night: {
          DEFAULT: '#141118',
          card: '#1d1a24',
          sunken: '#242030',
          line: '#2f2a3a',
        },
        sage: {
          50: '#f2f7f2',
          100: '#e0ede1',
          200: '#c2dbc4',
          300: '#94bd98',
          400: '#6a9a70',
          500: '#4d7d55',
          600: '#3b6442',
          700: '#325237',
          800: '#2a422e',
          900: '#243727',
        },
        clay: {
          50: '#fcf6f1',
          100: '#f8e9dd',
          200: '#f0d0b8',
          300: '#e5b08c',
          400: '#d78e63',
          500: '#c97a4b',
          600: '#b25f38',
          700: '#944a30',
          800: '#783e2c',
          900: '#633527',
        },
        brass: {
          100: '#f6ecd4',
          200: '#ecd9a8',
          300: '#dfbf73',
          400: '#cfa347',
          500: '#b8892c',
          600: '#96691f',
          700: '#774f1a',
        },
        rose: {
          50: '#fdf3f4',
          100: '#fbe4e7',
          200: '#f7cbd1',
          300: '#eda3ae',
          400: '#e07a8b',
          500: '#d05f74',
          600: '#b94460',
          700: '#9a3450',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        accent: ['"Fraunces"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,25,23,0.04), 0 8px 24px -12px rgba(28,25,23,0.12)',
        lift: '0 2px 4px rgba(28,25,23,0.05), 0 16px 40px -16px rgba(28,25,23,0.18)',
        glow: '0 8px 32px -8px rgba(185,68,96,0.35)',
      },
      transitionTimingFunction: {
        // Kurva khas Apple: cepat di awal, mendarat halus di akhir.
        glide: 'cubic-bezier(0.32, 0.72, 0, 1)',
        swift: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(3%, -4%) scale(1.06)' },
          '66%': { transform: 'translate(-3%, 3%) scale(0.96)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
        float: 'float 6s ease-in-out infinite',
        drift: 'drift 24s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
