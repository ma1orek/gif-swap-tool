// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // jeżeli chcesz inny port niż 5173
    port: 5173
  },
  build: {
    target: "es2020"
  }
});
