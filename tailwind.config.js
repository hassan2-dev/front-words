/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#003F3E", // أخضر طوخ
          light: "#02BAAA", // أخضر تركواز
        },
        secondary: {
          DEFAULT: "#FF914D", // برتقالي
          light: "#FFA366",
        },
        neutral: {
          DEFAULT: "#96A8AD", // رصاصي
          light: "#D8D0C5",
          lighter: "#E6E5E1",
        },
        accent: {
          teal: "#02BAAA", // تركواز
          orange: "#FF914D", // برتقالي
          sage: "#D8D0C5", // حكيم
          cream: "#E6E5E1", // كريمي
        },
      },
      fontFamily: {
        // Arabic fonts
        arabic: ["Cairo", "Noto Sans Arabic", "sans-serif"],
        "arabic-bold": ["Cairo", "Noto Sans Arabic", "sans-serif"],
        "arabic-light": ["Cairo", "Noto Sans Arabic", "sans-serif"],

        // English fonts
        english: ["Poppins", "Inter", "sans-serif"],
        "english-bold": ["Poppins", "Inter", "sans-serif"],
        "english-light": ["Poppins", "Inter", "sans-serif"],

        // Default fonts
        sans: ["Cairo", "Noto Sans Arabic", "Poppins", "Inter", "sans-serif"],
        serif: ["Cairo", "Noto Sans Arabic", "serif"],
        mono: ["Cairo", "Noto Sans Arabic", "monospace"],
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        slideUp: "slideUp 0.4s ease-out",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
