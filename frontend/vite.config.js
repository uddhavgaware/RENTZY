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
        // IMPORTANT: Order matters — more specific checks MUST come before general ones
        // to avoid circular chunk dependencies (e.g., react-leaflet depends on React,
        // so it must NOT be in the same chunk as pure leaflet).
        manualChunks(id) {
          // React core — must load first; catches react, react-dom, and scheduler
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-core';
          }
          // Framer motion — large animation library, separate chunk
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // Pure Leaflet only (NOT react-leaflet — it depends on React and goes to vendor)
          if (id.includes('node_modules/leaflet/')) {
            return 'leaflet';
          }
          // Charts — only loaded in dashboard
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          // Everything else from node_modules (including react-router-dom,
          // react-leaflet, @react-oauth, etc.) — these all depend on react-core
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
})

