import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      clientPort: 80,
    },
    allowedHosts: [
      'client',
      'localhost',
      'hackanton.ru'
    ],
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});