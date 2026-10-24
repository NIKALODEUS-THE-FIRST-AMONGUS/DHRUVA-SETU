import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three'],
          'ui-vendor': ['lucide-react', 'gsap', 'canvas-confetti']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
