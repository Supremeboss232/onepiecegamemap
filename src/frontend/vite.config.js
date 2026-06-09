import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  
  const apiBase = env.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE || 'http://localhost:3000';
  const wsUrl = env.REACT_APP_WS_URL || process.env.REACT_APP_WS_URL || 'ws://localhost:3000';
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          ws: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser'
    },
    define: {
      'process.env.REACT_APP_API_BASE': JSON.stringify(apiBase),
      'process.env.REACT_APP_WS_URL': JSON.stringify(wsUrl)
    }
  };
});
