/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        gator: {
          orange: "#FA4616",
          blue: "#0021A5",
        },
      },
    },
  },
  plugins: [],
};
