import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["macros", ["babel-plugin-react-compiler"]],
      },
    }),
    lingui(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@mantine/core", "@mantine/hooks"],
        },
      },
    },
  },
  server: {
    //port: 5174,          // Fixed port
    //strictPort: true,    // Don't switch ports automatically
    host:  "localhost", // Cross-platform support
    proxy: {
      "/api": {
        target: "http://localhost:8000/",
        changeOrigin: true,
        rewrite: (path) => path,
      },
      "/directus": {
        target: "http://localhost:8055",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/directus/, "/"),
      },
    },
  },
});
