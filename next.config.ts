// next.config.ts
import type { NextConfig } from "next";
import nextI18NextConfig from "./src/i18n/next-i18next.config.js";

const { i18n } = nextI18NextConfig;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  i18n: {
    defaultLocale: i18n.defaultLocale,
    locales: i18n.locales,
  },
};

export default nextConfig;