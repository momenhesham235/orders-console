import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Same-origin /api in the browser: no CORS setup needed in development.
      proxy: {
        "/api": env.VITE_API_PROXY_TARGET ?? "http://localhost:4000",
      },
    },
  };
});
