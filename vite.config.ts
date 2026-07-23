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
        // 模板预览优先保证运行时稳定，三方依赖统一收敛到一个 vendor chunk。
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@cvicse/react-utils',
        replacement: '@gjxwxt/react-utils',
      },
      {
        find: '@cvicse/icons',
        replacement: '@gjxwxt/icons',
      },
      {
        find: '@cvicse/react-style-base',
        replacement: '@gjxwxt/react-style-base',
      },
    ],
  },
  server: {
    watch: {
      usePolling: true,
      interval: 120,
    },
  },
});
