
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Plugin react tidak perlu diimport manual jika menggunakan esm.sh di html, 
  // namun untuk Vercel build kita gunakan standard Vite
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          mediapipe: ['@mediapipe/hands', '@mediapipe/camera_utils']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
