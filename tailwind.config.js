/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a1628",
          secondary: "#0f2137",
          tertiary: "#152a45",
          card: "#0d1f36",
        },
        border: {
          primary: "rgba(0, 212, 255, 0.2)",
          secondary: "rgba(0, 212, 255, 0.1)",
        },
        primary: {
          DEFAULT: "#00d4ff",
          50: "#e6f9ff",
          100: "#b3ecff",
          200: "#80dfff",
          300: "#4dd2ff",
          400: "#1ac5ff",
          500: "#00d4ff",
          600: "#00a8cc",
          700: "#007c99",
          800: "#005066",
          900: "#002433",
        },
        alert: {
          1: "#ff3d3d",
          2: "#ff8a00",
          3: "#ffc700",
          success: "#00ff88",
          info: "#00d4ff",
          warning: "#ff8a00",
          danger: "#ff3d3d",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Noto Sans SC", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan 3s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
        "marquee": "marquee 20s linear infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 212, 255, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      boxShadow: {
        "glow-primary": "0 0 15px rgba(0, 212, 255, 0.4)",
        "glow-danger": "0 0 15px rgba(255, 61, 61, 0.4)",
        "glow-warning": "0 0 15px rgba(255, 138, 0, 0.4)",
        "glow-success": "0 0 15px rgba(0, 255, 136, 0.4)",
        "card": "0 4px 20px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
