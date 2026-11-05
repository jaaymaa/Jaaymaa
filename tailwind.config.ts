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
        ink:      "#0F1E3D",
        sun:      "#FFC83D",
        hibiscus: "#C8265A",
        baobab:   "#0E7C66",
        nuit:     "#0A1530",
        papier:   "#FFFBF2",
        muted:    "#3F4B69",
        ghost:    "#C3CCE6",
        line:     "#E1E6F0",
        // Legacy
        primary:  "#FFC83D",
        bg:       "#FFFBF2",
        surface:  "#FFFFFF",
        chip:     "#F0EDE8",
        hero:     "#0F1E3D",
        sun_alt:  "#FF9B21",
        leaf:     "#0E7C66",
        rose:     "#C8265A",
      },
      fontFamily: {
        bricolage: ["var(--font-bricolage)", "sans-serif"],
        sans:      ["var(--font-instrument)", "sans-serif"],
      },
      fontSize: {
        xs: ["12.5px", { lineHeight: "1rem" }],
        sm: ["15px", { lineHeight: "1.375rem" }],
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-up": {
          "0%":   { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
      },
      animation: {
        "fade-up":      "fade-up 0.6s ease-out forwards",
        "fade-up-slow": "fade-up 0.8s ease-out forwards",
        "fade-in":      "fade-in 0.4s ease-out forwards",
        float:          "float 3s ease-in-out infinite",
        shimmer:        "shimmer 2.5s linear infinite",
        "slide-up":     "slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;
