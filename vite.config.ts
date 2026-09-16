import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  // Classic JSX, compiled to React.createElement — so every file using JSX
  // imports React itself. The automatic runtime would import react/jsx-runtime,
  // and that import cannot be externalised in the UMD build (there is no global
  // to map it to) — so it was being inlined, which shipped React 18's runtime
  // inside the bundle. On a React 19 host that copy reads
  // React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, which React 19
  // renamed, and the whole app dies at import with "Cannot read properties of
  // undefined (reading 'ReactCurrentDispatcher')". createElement exists in both
  // 18 and 19, so this makes the >=18 peer range true for the first time.
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  plugins: [
    react({ jsxRuntime: 'classic' }),
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
