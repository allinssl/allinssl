import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

export default defineConfig({
	plugins: [vue(), vueJsx()],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@hooks': resolve(__dirname, './src/hooks'),
		},
	},
	server: {
		port: 3000,
	},
})
