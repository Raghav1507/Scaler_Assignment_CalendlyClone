/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF"
        },
        accent: {
          500: "#06B6D4",
          600: "#0891B2"
        },
        surface: "#FFFFFF"
      },
      boxShadow: {
        "soft-xl": "0 22px 45px rgba(15,23,42,0.18)"
      }
    }
  },
  plugins: []
};

