import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

const isNodeModulePackage = (id, packageName) => {
  const normalized = id.replace(/\\/g, '/');
  return normalized.includes(`/node_modules/${packageName}/`);
};

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
              isNodeModulePackage(id, 'echarts') ||
              isNodeModulePackage(id, 'echarts-for-react')
            ) {
              return 'vendor-echarts';
            }

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
