/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/RomisGame/",
  build: {
    target: "es2020",
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Romi's English Adventure",
        short_name: "Romi's TV",
        description: "A cozy TV of English learning quests for Romi.",
        start_url: "/RomisGame/",
        scope: "/RomisGame/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0d0b1a",
        theme_color: "#0d0b1a",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,wav,json}"],
        // Content JSON must work offline after the first load.
        runtimeCaching: [
          {
            urlPattern: /\.json$/,
            handler: "CacheFirst",
            options: { cacheName: "content-cache" },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["node_modules/**", "tests/e2e/**"],
  },
});
