import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig({
  base: process.env.VITE_PUBLIC_BASE_PATH || '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react/') ||
              id.includes('react-dom/') ||
              id.includes('react-router-dom/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('@ant-design/icons')) {
              return 'vendor-icons';
            }
            if (id.includes('antd/') || id.includes('antd-style/')) {
              return 'vendor-antd';
            }
            if (id.includes('echarts/')) {
              return 'vendor-echarts';
            }
          }
        },
      },
    },
  },
  server: {
    watch: {
      usePolling: true,
      interval: 120,
    },
  },
});
