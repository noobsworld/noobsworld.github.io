import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 5173,
        host: '0.0.0.0',
        open: true
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                spinner: resolve(__dirname, 'spinner/index.html'),
                vial: resolve(__dirname, 'vial/index.html')
            }
        }
    }
})
