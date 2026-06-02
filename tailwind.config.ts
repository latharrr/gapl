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
        primary: {
          DEFAULT: "#4F46E5",
          foreground: "#FFFFFF",
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        ink: {
          DEFAULT: "#111111",
          secondary: "#3F3F46",
          muted: "#71717A",
          faint: "#A1A1AA",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#FAFAFA",
          subtle: "#F4F4F5",
        },
        border: {
          DEFAULT: "#E4E4E7",
          strong: "#D4D4D8",
        },
        success: {
          DEFAULT: "#16A34A",
          bg: "#F0FDF4",
          border: "#BBF7D0",
        },
        warning: {
          DEFAULT: "#F59E0B",
          bg: "#FFFBEB",
          border: "#FDE68A",
        },
        danger: {
          DEFAULT: "#DC2626",
          bg: "#FEF2F2",
          border: "#FECACA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "sm": "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "DEFAULT": "0 2px 8px 0 rgb(0 0 0 / 0.06), 0 1px 3px -1px rgb(0 0 0 / 0.04)",
        "md": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        "lg": "0 8px 24px 0 rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.05)",
        "xl": "0 16px 40px 0 rgb(0 0 0 / 0.1), 0 8px 16px -8px rgb(0 0 0 / 0.06)",
        "card": "0 0 0 1px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.05)",
        "ring": "0 0 0 3px rgba(79, 70, 229, 0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 1.5s infinite",
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
