import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	build: {
		outDir: 'dist/webview',
		rollupOptions: {
			input: './src/webview/index.tsx',
			output: {
				entryFileNames: 'webview.js',
				assetFileNames: (assetInfo) => {
					if (assetInfo.name === 'index.css') {
						return 'webview.css';
					}
					return 'webview.[ext]';
				}
			}
		}
	}
});
