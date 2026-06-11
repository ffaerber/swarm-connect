import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], outDir: 'dist', insertTypesEntry: true }),
  ],
  // Fall back to polling when the system inotify watch limit is exhausted
  // (dev server otherwise crashes with ENOSPC). Enabled by `npm run dev:poll`.
  server: process.env.VITE_USE_POLLING
    ? { watch: { usePolling: true, interval: 300 } }
    : undefined,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SwarmConnect',
      fileName: 'swarm-connect',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'wagmi', 'viem', '@tanstack/react-query'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          wagmi: 'wagmi',
          viem: 'viem',
          '@tanstack/react-query': 'ReactQuery',
        },
      },
    },
  },
})
