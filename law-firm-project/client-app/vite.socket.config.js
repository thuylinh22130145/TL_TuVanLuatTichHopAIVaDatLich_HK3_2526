import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'socket-entry',
      transformIndexHtml(html) {
        return html.replace('/src/main.jsx', '/src/main-realtime.jsx');
      },
    },
  ],
  server: {
    port: 5173,
    open: true,
  },
});
