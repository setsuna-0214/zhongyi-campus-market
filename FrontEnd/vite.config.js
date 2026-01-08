import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Windows 某些环境会将 5173 等端口加入 TCP excluded ranges，导致 Vite 监听时报 EACCES。
// 这里默认使用 3000，并允许通过 VITE_DEV_PORT/PORT 覆盖。
const defaultDevPort = 3000;
const parsedDevPort = Number.parseInt(process.env.VITE_DEV_PORT || process.env.PORT || '', 10);
const devPort = Number.isFinite(parsedDevPort) && parsedDevPort > 0 ? parsedDevPort : defaultDevPort;

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
    port: devPort,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
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
