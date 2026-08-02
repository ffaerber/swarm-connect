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
      // Subpaths too — matching the bare names alone would inline
      // `wagmi/chains` and `wagmi/connectors` (and with them a second copy of
      // the connector stack) into the bundle instead of using the host's.
      // `react/jsx-runtime` stays bundled on purpose: it is a thin shim over
      // the external `react`, and the UMD build has no global to map it to.
      external: [
        'react', 'react-dom', '@tanstack/react-query',
        /^wagmi($|\/)/, /^viem($|\/)/,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          wagmi: 'wagmi',
          'wagmi/chains': 'wagmi.chains',
          'wagmi/connectors': 'wagmi.connectors',
          viem: 'viem',
          '@tanstack/react-query': 'ReactQuery',
        },
      },
    },
  },
})
