import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    // 生产环境禁用 sourcemap 以避免源码泄露
    sourcemap: false,
    // 提高 chunk 大小警告阈值（默认 500KB）
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 手动分割代码块，优化加载性能
        manualChunks: {
          // React 核心库
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Ant Design UI 库
          'vendor-antd': ['antd', '@ant-design/icons'],
          // 其他第三方库
          'vendor-utils': ['axios', 'dayjs'],
        },
      },
    },
  },
});
