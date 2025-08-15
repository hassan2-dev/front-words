import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, '/api'),
                timeout: 180000, // 3 دقائق للـ GPT-4
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                    });
                    proxy.on('proxyRes', (proxyRes, req, _res) => {
                    });
                },
            }
        }
    },
    preview: {
        port: 3001,
        host: true
    },
    define: {
        'import.meta.env': JSON.stringify(process.env)
    }
}) 