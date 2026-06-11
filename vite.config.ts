import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], outDir: 'dist', insertTypesEntry: true }),
  ],
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
