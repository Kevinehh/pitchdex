import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Where the API runs locally. Set API_URL to point the frontend at another port.
const apiUrl = process.env.API_URL ?? "http://localhost:5080"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    port: 5173,
    // The API runs separately in development. Proxying /api keeps the browser on
    // one origin, the same way CloudFront will in production.
    proxy: { "/api": apiUrl },
  },
})
