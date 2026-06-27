import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#E8540A",
          "orange-hover": "#C94508",
          "orange-light": "#FFF3ED",
          dark: "#0F0F1A",
          navy: "#1C1C2E",
          "navy-card": "#242438",
          "navy-border": "#2E2E45",
        },
        surface: {
          light: "#F8F9FC",
          gray: "#F1F2F7",
          border: "#E4E5EF",
          white: "#FFFFFF",
        },
        text: {
          primary: "#0F0F1A",
          secondary: "#4A4A6A",
          muted: "#9090A8",
        },
      },
      fontFamily: {
        syne: ["Poppins", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        "open-sans": ["Open Sans", "sans-serif"],
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        "gradient-orange": "linear-gradient(135deg, #E8540A 0%, #FF6B35 100%)",
        "gradient-dark": "linear-gradient(180deg, #0F0F1A 0%, #1C1C2E 100%)",
      },
      boxShadow: {
        "card-soft": "0 2px 20px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.12)",
        "btn-orange": "0 8px 24px rgba(232,84,10,0.35)",
        "btn-orange-lg": "0 12px 32px rgba(232,84,10,0.4)",
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
