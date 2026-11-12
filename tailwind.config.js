/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep ocean palette
        abyss: "#040a14",       // page background
        hull:  "#0a1424",       // panel background
        steel: "#152238",       // borders, dividers
        mist:  "#2a3a55",       // muted text
        bone:  "#e8ecf3",       // primary text
        // Signal accent (data highlights)
        signal: {
          DEFAULT: "#22d3ee",   // cyan - primary accent
          dim:     "#0891b2",   // hovered/secondary
          warm:    "#fbbf24",   // warning amber
          danger:  "#f87171",   // bad conditions
          good:    "#34d399",   // optimal conditions
        },
      },
      fontFamily: {
        // Display serif: warm, distinctive for headings
        display: ['"Fraunces"', 'Georgia', 'serif'],
        // Body sans
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        // Monospace for data readouts (instrument feel)
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
