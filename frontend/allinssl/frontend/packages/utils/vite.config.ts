import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
	root: resolve(__dirname, './src'),
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
				browser: resolve(__dirname, 'src/browser.ts'),
				business: resolve(__dirname, 'src/business.ts'),
				data: resolve(__dirname, 'src/data.ts'),
				date: resolve(__dirname, 'src/date.ts'),
				encipher: resolve(__dirname, 'src/encipher.ts'),
				random: resolve(__dirname, 'src/random.ts'),
				string: resolve(__dirname, 'src/string.ts'),
				type: resolve(__dirname, 'src/type.ts'),
			},
			name: 'BaotaUtils',
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['jsencrypt', 'md5', 'ramda'],
			output: {
				globals: {
					jsencrypt: 'JSEncrypt',
					md5: 'md5',
					ramda: 'R',
				},
			},
		},
	},
})
