import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the example/ playground as a static site (for Swarm hosting).
// base: './' makes every asset path relative so it works when served from a
// content-addressed subpath like bzz/<hash>/.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'example-dist',
    emptyOutDir: true,
  },
})
