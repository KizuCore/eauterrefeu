import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from '@tomjs/vite-plugin-electron'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        entry: {
          preload: 'electron/preload.ts',
        },
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
