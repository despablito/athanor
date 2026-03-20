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
          0: "#07090f",
          1: "#0f1420",
          2: "#151b2a",
          3: "#1c2436",
          4: "#243044",
        },
        accent: {
          blue: "#5b9cf6",
          purple: "#b47cf7",
          green: "#34d399",
          orange: "#f5a623",
          red: "#e85d75",
          cyan: "#45c9a0",
          yellow: "#fbbf24",
          pink: "#ec4899",
        },
      },
    },
  },
  plugins: [],
};

export default config;
