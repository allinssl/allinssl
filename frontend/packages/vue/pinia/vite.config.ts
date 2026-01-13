import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
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
			entry: {
				index: resolve(__dirname, 'src/index.ts'),
				utils: resolve(__dirname, 'src/utils.ts'),
			},
			name: 'BaotaPinia',
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['pinia', 'pinia-plugin-persistedstate'],
			output: {
				globals: {
					pinia: 'Pinia',
					'pinia-plugin-persistedstate': 'piniaPluginPersistedstate',
				},
			},
		},
	},
})
