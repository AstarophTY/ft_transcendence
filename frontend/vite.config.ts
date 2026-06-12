import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({  
  plugins: [react(), tsconfigPaths()],
  server: {
    host: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    // Split the heavy, rarely-changing vendors into their own chunks so the
    // browser caches them across app deploys (Three.js + React are the bulk).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three') || id.includes('@react-three')) return 'three'
          if (id.includes('react') || id.includes('scheduler')) return 'react'
        },
      },
    },
    // Three.js alone is ~600 kB minified, so the 500 kB default is never
    // realistic for a WebGL app — raise the bar to silence the informational
    // "chunk larger than 500 kB" warning rather than chase an impossible target.
    chunkSizeWarningLimit: 1500,
  },
})

