import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

export default defineConfig({
  root: "dev",
  plugins: [vue(), tailwindcss()],
  server: { host: "0.0.0.0" },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
})
