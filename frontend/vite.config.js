import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
    // Target modern browsers — removes unnecessary polyfills
    target: 'es2020',
    // Increase chunk size warning limit (framer-motion + leaflet are large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor chunks so browser can cache them separately
        manualChunks(id) {
          // React core — tiny, loaded first
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          // Router — loaded immediately
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/@remix-run')) {
            return 'router';
          }
          // Framer motion — large animation library, separate chunk
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // Leaflet map — only loaded on pages with maps
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'leaflet';
          }
          // Charts — only loaded in dashboard
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          // Everything else from node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
})

