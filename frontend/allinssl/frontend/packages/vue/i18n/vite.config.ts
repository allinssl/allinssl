import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
	root: resolve(__dirname, './src'),
	plugins: [
		vue(),
		dts({
			include: ['*.ts'],
			beforeWriteFile: (filePath, content) => ({
				filePath: filePath.replace(/src/, ''),
				content,
			}),
		}),
	],
	build: {
		outDir: resolve(__dirname, 'dist'),
		emptyOutDir: true,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'BaotaI18n',
			formats: ['es', 'cjs'],
			fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['vue', 'vue-i18n', '@vueuse/core'],
			output: {
				globals: {
					vue: 'Vue',
					'vue-i18n': 'VueI18n',
					'@vueuse/core': 'VueUse',
				},
			},
		},
	},
})
