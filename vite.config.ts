import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@data': resolve(root, 'data'),
    },
  },
  server: {
    fs: {
      allow: [root],
    },
  },
})
