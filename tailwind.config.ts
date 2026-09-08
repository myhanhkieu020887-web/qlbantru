import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ribbon: {
          bg: "#f3f4f6",
          border: "#d1d5db",
          active: "#ffffff",
          hover: "#e5e7eb",
          accent: "#0066cc",
          accentHover: "#0052a3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
