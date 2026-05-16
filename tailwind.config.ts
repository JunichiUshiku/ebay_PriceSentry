import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#E5E7EB",
        surface: "#F9FAFB",
        navy: "#0F172A",
        primary: "#2563EB",
        "primary-active": "#1E40AF",
      },
      borderRadius: {
        card: "8px",
        button: "6px",
      },
      fontSize: {
        dense: "11.5px",
      },
    },
  },
  plugins: [],
};

export default config;
