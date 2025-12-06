import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This is required for the Google GenAI SDK to work in the browser
    'process.env': {} 
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    // Proxy only works in development - in production (Vercel), API is on same domain
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});