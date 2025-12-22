import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	optimizeDeps: {
		include: ['monaco-editor']
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					monaco: ['monaco-editor']
				}
			}
		}
	},
	server: {
		proxy: {
			// Proxy API requests to backend server to avoid CORS issues in development
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '/engine')
			}
		}
	}
});
