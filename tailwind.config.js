/**
 * @fileoverview Tailwind CSS configuration for MHWS Set Builder.
 * @see https://tailwindcss.com/docs/configuration
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // NOTE: Most theme configurations have been migrated to the @theme block in src/index.css.
      // Only complex raw media queries are kept here.
      screens: {
        portrait: { raw: "(orientation: portrait)" },
        landscape: { raw: "(orientation: landscape)" },
        "mobile-landscape": {
          raw: "(max-width: 767px) and (orientation: landscape)",
        },
      },
    },
  },
  plugins: [],
};
