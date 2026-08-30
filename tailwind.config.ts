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
        background: "#0f1115",
        surface: "#181b21",
        "surface-hover": "#22262e",
        border: "rgba(255, 255, 255, 0.08)",
        muted: "#9aa0a6",
        foreground: "#e8eaed",
        primary: {
          DEFAULT: "#ff9900",
          hover: "#ffb020",
          ink: "#131313",
        },
        accent: {
          DEFAULT: "#4c8bf5",
          hover: "#6aa1ff",
          soft: "#8ab4f8",
        },
        purple: {
          DEFAULT: "#ff9900",
          light: "#ffb84d",
        },
        blue: {
          DEFAULT: "#4c8bf5",
          light: "#8ab4f8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
