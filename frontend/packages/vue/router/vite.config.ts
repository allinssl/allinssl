import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
	build: {
		outDir: resolve(__dirname, 'dist'),
		emptyOutDir: true,
		lib: {
			entry: {
				index: resolve(__dirname, 'src/index.ts'),
				import: resolve(__dirname, 'src/import.ts'),
				each: resolve(__dirname, 'src/each.ts'),
			},
			name: 'BaotaRouter',
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['vue-router', '@baota/utils'],
			output: {
				globals: {
					'vue-router': 'VueRouter',
					'@baota/utils': 'BaotaUtils',
				},
			},
		},
	},
	plugins: [],
})
