/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "*/index.html"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#dfe2e9",
          100: "#b1b6c5",
          200: "#858ca1",
          300: "#69718b",
          400: "#515a72",
          500: "#3a4259",
          600: "#30374c",
          700: "#262c3e",
          800: "#1d2131",
          900: "#151925",
          950: "#0e111a",
        },
      },
    },
  },
  plugins: [],
}
