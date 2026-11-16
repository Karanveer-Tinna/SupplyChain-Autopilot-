/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Catppuccin Canvas Layers
        crust: '#11111b',
        mantle: '#181825',
        base: '#1e1e2e',
        surface0: '#313244',
        surface1: '#45475a',
        surface2: '#585b70',
        overlay0: '#6c7086',
        subtext0: '#a6adc8',
        subtext1: '#bac2de',
        text: '#cdd6f4',

        // Accents for Agent States
        mauve: {
          DEFAULT: '#cba6f7',
          light: '#d6b8f9',
          dark: '#b382ef',
        },
        lavender: {
          DEFAULT: '#b4befe',
          light: '#c8d0ff',
          dark: '#9ca9f7',
        },
        blue: {
          DEFAULT: '#89b4fa',
          light: '#a4c6fc',
          dark: '#6896e3',
        },
        sapphire: {
          DEFAULT: '#74c7ec',
          light: '#91d6f2',
          dark: '#54add4',
        },
        green: {
          DEFAULT: '#a6e3a1',
          light: '#bcf0b8',
          dark: '#85c980',
        },
        peach: {
          DEFAULT: '#fab387',
          light: '#fbc5a2',
          dark: '#e09869',
        },
        yellow: {
          DEFAULT: '#f9e2af',
          light: '#fbebc4',
          dark: '#e2ca92',
        },
        red: {
          DEFAULT: '#f38ba8',
          light: '#f6a4bb',
          dark: '#d66e8c',
        },

        // Legacy compatibility mappings tuned to Catppuccin
        slate: {
          700: '#45475a', // surface1
          750: '#3a3c4f',
          800: '#313244', // surface0
          850: '#262738',
          900: '#181825', // mantle
          950: '#11111b', // crust
        },
      }
    },
  },
  plugins: [],
}
