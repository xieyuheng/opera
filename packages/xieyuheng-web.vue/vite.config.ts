import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { host: '0.0.0.0' },
  build: {
    sourcemap: true,
    target: 'es2022',
  },
  plugins: [vue(), tailwindcss()],
})