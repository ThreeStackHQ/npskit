import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          400: "#38bdf8",
          500: "#0ea5e9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
