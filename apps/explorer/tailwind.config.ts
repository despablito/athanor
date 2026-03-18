import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          0: "#0a0a0f",
          1: "#12121a",
          2: "#1a1a25",
          3: "#242430",
          4: "#2e2e3c",
        },
        accent: {
          blue: "#4a9eff",
          purple: "#a855f7",
          green: "#22c55e",
          orange: "#f97316",
          red: "#ef4444",
          cyan: "#06b6d4",
          yellow: "#eab308",
          pink: "#ec4899",
        },
      },
    },
  },
  plugins: [],
};

export default config;
