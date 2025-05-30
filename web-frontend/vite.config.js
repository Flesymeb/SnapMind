// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', //让其他设备可以访问
        port: 5173,
        proxy: {
            '/latest_answer': {
                target: 'http://localhost:8000',
                changeOrigin: true
            },
            '/history': {
                target: 'http://localhost:8000',
                changeOrigin: true
            }
        }
    }
})
