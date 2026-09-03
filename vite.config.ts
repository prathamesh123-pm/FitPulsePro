import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Firebase packages
              if (id.includes('/firebase/') || id.includes('/@firebase/')) {
                return 'vendor-firebase';
              }
              // PDF & Docx exports (heavy, only loaded when exporting)
              if (id.includes('/jspdf/') || id.includes('/docx/') || id.includes('/canvas-confetti/')) {
                return 'vendor-export-media';
              }
              // Charts & visualization
              if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) {
                return 'vendor-charts';
              }
              // Icons
              if (id.includes('/lucide-react/')) {
                return 'vendor-icons';
              }
              // Core React runtime & animation engine
              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/scheduler/') ||
                id.includes('/motion/')
              ) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
