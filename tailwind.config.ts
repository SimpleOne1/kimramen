import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: "var(--terracotta-accent)",   // #E56A54
        sunray: "var(--sunray-yellow)",           // #FBE122
        cobalt: "var(--deep-cobalt)",             // #0067B9
        porcelain: "var(--porcelain-white)",      // #EEE9EA
        basalt: "var(--graphite-basalt)",         // #19191A
      },
    },
  },
  plugins: [],
};

export default config;