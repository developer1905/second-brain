import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        foreground: "#f8fafc",
        card: {
          DEFAULT: "rgba(15, 23, 42, 0.75)",
          hover: "rgba(30, 41, 59, 0.85)",
          border: "rgba(255, 255, 255, 0.1)",
        },
        para: {
          project: "#00f3ff",   // Neon Cyan
          area: "#9d4edd",      // Neon Violet
          resource: "#ffd166",  // Bright Gold
          archive: "#6c757d",   // Muted Gray
          telegram: "#0088cc",  // Electric Blue
          github: "#2ea44f",    // Bright Green
          book: "#ff9f1c",      // Soft Orange
          voice: "#ff007f",     // Pink/Magenta
        },
      },
      boxShadow: {
        glowCyan: "0 0 20px rgba(0, 243, 255, 0.35)",
        glowViolet: "0 0 20px rgba(157, 78, 221, 0.35)",
        glowGold: "0 0 20px rgba(255, 209, 102, 0.35)",
        glowPink: "0 0 20px rgba(255, 0, 127, 0.35)",
      },
      animation: {
        pulseGlow: "pulseGlow 2.5s infinite ease-in-out",
        float: "float 6s infinite ease-in-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
