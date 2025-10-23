import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from '@tomjs/vite-plugin-electron'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        entry: { preload: 'electron/preload.ts' },
      },
    }),
  ],
})
