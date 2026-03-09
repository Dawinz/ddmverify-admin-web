import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f7ff",
          100: "#e4ebff",
          200: "#c7d3ff",
          300: "#9dafff",
          400: "#6b7cff",
          500: "#3948ff",
          600: "#2635db",
          700: "#1e2aac",
          800: "#181f80",
          900: "#141b66"
        }
      }
    }
  },
  plugins: []
};

export default config;

