// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 프론트 5173/5174 → 백엔드(예: Django 8000)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    hmr: { host: "localhost", protocol: "ws" }
  },
});
