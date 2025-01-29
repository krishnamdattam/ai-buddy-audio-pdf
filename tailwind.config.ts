import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#6D28D9",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#EDE9FE",
          foreground: "#1F2937",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "magic-pulse": {
          "0%": { 
            opacity: "0.4", 
            transform: "scale(0.98)", 
            filter: "blur(8px)" 
          },
          "33%": { 
            opacity: "0.7", 
            transform: "scale(1.03)", 
            filter: "blur(12px)" 
          },
          "66%": { 
            opacity: "0.5", 
            transform: "scale(1.05)", 
            filter: "blur(16px)" 
          },
          "100%": { 
            opacity: "0.4", 
            transform: "scale(0.98)", 
            filter: "blur(8px)" 
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "magic-pulse": "magic-pulse 8s ease-in-out infinite",
        "magic-pulse-delayed": "magic-pulse 8s ease-in-out infinite 2s",
        "magic-pulse-delayed-2": "magic-pulse 8s ease-in-out infinite 4s"
      },
      transitionDelay: {
        '75': '75ms',
        '150': '150ms',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;