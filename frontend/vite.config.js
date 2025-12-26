import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true, // Permite conexiones desde la red local
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000', // Usar 127.0.0.1 en lugar de localhost para mejor compatibilidad
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false, // Permitir conexiones no seguras
        // Configurar para que funcione desde la red local
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('➡️  Proxying:', req.method, req.url, '→ http://127.0.0.1:3000');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})




