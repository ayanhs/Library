import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#131314",
        surface: "#1e1f20",
        "surface-hover": "#282a2c",
        border: "#3f4144",
        muted: "#9aa0a6",
        foreground: "#e3e3e3",
        primary: {
          DEFAULT: "#a8c7fa",
          hover: "#c2d7fc",
          ink: "#062e6f",
        },
        accent: {
          DEFAULT: "#a8c7fa",
          hover: "#c2d7fc",
          soft: "#c2d7fc",
        },
        purple: {
          DEFAULT: "#9b72cb",
          light: "#cfbcff",
        },
        blue: {
          DEFAULT: "#4285f4",
          light: "#a8c7fa",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        gemini: "1.5rem",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out forwards",
        "slide-up": "slideUp 0.35s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
