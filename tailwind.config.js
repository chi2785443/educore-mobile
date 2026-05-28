/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#4C3FC4",
          red: "#F5486A",
          orange: "#ff6600",
          blue: "#131d3b",
          pink: "#F5486A",
          mint: "#E8F5EE",
          salmon: "#FFF0F0",
          sky: "#E8F4FF",
          lavender: "#F0EEFF",
          amber: "#FEF3C7",
        },
      },
      fontFamily: {
        sans: ["Poppins_400Regular", "System"],
        semibold: ["Poppins_600SemiBold", "System"],
        bold: ["Poppins_700Bold", "System"],
        extrabold: ["Poppins_800ExtraBold", "System"],
      },
    },
  },
  plugins: [],
};
