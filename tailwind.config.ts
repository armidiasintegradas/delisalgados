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
        deli: {
          coral: "#E05A36",
          "coral-light": "#FBEAE5",
          "coral-dark": "#C04220",
          cream: "#FFF9F2",
          "cream-card": "#FFFFFF",
          "cream-dark": "#F5EADB",
          sand: "#EBDAC8",
          brown: "#3C1F15",
          "brown-light": "#614439",
          "brown-dark": "#27120A",
          green: "#25D366",
          "green-dark": "#1FAA52",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
