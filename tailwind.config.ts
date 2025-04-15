import type { Config } from "tailwindcss";
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "open-sans": ["var(--font-open-sans)"],
        "colour-sans": ["var(--font-colour-sans)"],
        helvetica: ["var(--font-helvetica-neue)"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#DEB349",
        secondary: "#E4DABF",
        third: "#968550",
        black: "#4d4d4d",
        white: "#F4F4F4",
        blueDulux: "#022A68",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "100%",
            color: "var(--tw-prose-body)",
            lineHeight: "1.75",
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
