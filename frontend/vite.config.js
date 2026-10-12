import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Forward /api requests to Nginx Load Balancer on port 80
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true
      },
      // Forward /health requests to Nginx
      '/health': {
        target: 'http://localhost:80',
        changeOrigin: true
      }
    }
  }
});
