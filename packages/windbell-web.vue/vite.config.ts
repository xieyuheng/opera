import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: { host: '0.0.0.0' },
  build: {
    sourcemap: true,
    // The SPA ships as a single static bundle; suppress Vite's default
    // 500 kB chunk-size warning.
    chunkSizeWarningLimit: 10_000,
  },
})
