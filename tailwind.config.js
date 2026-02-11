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
          DEFAULT: '#1a1a2e',
          light: '#f5f5f7'
        },
        secondary: {
          DEFAULT: '#252540',
          light: '#e5e5ea'
        },
        tertiary: {
          DEFAULT: '#1a1a2e',
          light: '#ffffff'
        },
        muted: {
          DEFAULT: '#888899',
          light: '#666677'
        },
        border: {
          DEFAULT: '#444466',
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
