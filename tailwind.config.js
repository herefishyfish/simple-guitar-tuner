/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{css,xml,html,vue,svelte,ts,tsx}'],
  // use the .ns-dark class to control dark mode (applied by NativeScript) - since 'media' (default) is not supported.
  darkMode: ['class', '.ns-dark'],
  theme: {
    extend: {
      colors: {
        // Dark theme colors (default)
        primary: {
          DEFAULT: '#0a0a0a',
          light: '#f5f5f7'
        },
        secondary: {
          DEFAULT: '#2c2c2e',
          light: '#e5e5ea'
        },
        tertiary: {
          DEFAULT: '#0a0a0a',
          light: '#ffffff'
        },
        muted: {
          DEFAULT: '#888899',
          light: '#666677'
        },
        border: {
          DEFAULT: '#3c3c3e',
          light: '#d1d1d6'
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // disables browser-specific resets
  },
}
