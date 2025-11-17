import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from '@tomjs/vite-plugin-electron'
import path from 'path'

export default defineConfig({
  base: './', // important pour que les chemins relatifs fonctionnent en production
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts' // juste l'entrée, pas de propriété "vite"
      },
      preload: {
        entry: { preload: 'electron/preload.ts' } // entrée du preload
      }
    })
  ],
  build: {
    outDir: 'dist/renderer', // sortie du renderer (Vite)
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
