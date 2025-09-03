import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path, { resolve } from 'path'
import UnoCSS from '@unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import randomCachePlugin from '@baota/vite-plugin-path-random'

const packPath = 'domain_static/' // 打包后的vite目录
const isDev = process.env.NODE_ENV === 'development' // 开发环境

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueJsx(),
		UnoCSS(),
		// 自动引入 API
		AutoImport({
			imports: [
				'vue',
				'vue-router',
				'pinia',
				{
					'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
				},
			],
			dts: './types/auto-imports.d.ts',
			eslintrc: {
				enabled: true, // 生成 eslint 配置
				filepath: './types/.eslintrc-auto-import.json',
				globalsPropValue: true,
			},
		}),
		// 自动引入组件
		Components({
			resolvers: [NaiveUiResolver()],
			dts: './types/components.d.ts',
			dirs: ['src/components'],
			extensions: ['vue', 'tsx'],
			directoryAsNamespace: false, // 是否将目录作为命名空间
		}),
		// 文件增加随机参数
		randomCachePlugin(),
		// SVG 图标插件
		createSvgIconsPlugin({
			iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
			symbolId: 'icon-[dir]-[name]',
			inject: 'body-last',
			customDomId: '__svg__icons__dom__',
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'@views': path.resolve(__dirname, 'src/views'),
			'@styles': path.resolve(__dirname, 'src/styles'),
			'@stores': path.resolve(__dirname, 'src/stores'),
			'@components': path.resolve(__dirname, 'src/components'),
			'@api': path.resolve(__dirname, 'src/api'),
			'@types': path.resolve(__dirname, 'src/types'),
			'@assets': path.resolve(__dirname, 'src/assets'),
			'@locales': path.resolve(__dirname, 'src/locales'),
			'@router': path.resolve(__dirname, 'src/router'),
			'@layout': path.resolve(__dirname, 'src/views/layout'),
		},
	},
	build: {
		minify: 'terser', // 混淆器，terser构建后文件体积更小
		// assetsDir: `${packPath}/`, // 静态资源目录
		sourcemap: false,
		cssCodeSplit: false, // 不分割css代码
		reportCompressedSize: false, // 不统计gzip压缩后的文件大小
		chunkSizeWarningLimit: 800, // 警告阈值
		assetsInlineLimit: 2048, // 小于2kb的资源内联
		modulePreload: false, // 禁用预加载
		terserOptions: {
			// 打包后移除console和注释
			compress: {
				drop_console: !isDev, // 生产环境移除console
				drop_debugger: !isDev, // 生产环境移除debugger
			},
		},
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'), // 主页面
			},
			strictDeprecations: true, // 严格弃用
			output: {
				entryFileNames: `${packPath}js/[name].js`,
				chunkFileNames: `${packPath}js/[name].js`,
				assetFileNames: (chunkInfo) => {
					const { names } = chunkInfo
					let ext = '[ext]'
					if (names && names.length > 0) {
						const name = names[0]
						const str = name.substring(name.lastIndexOf('.') + 1)
						if (str === 'ttf' || str === 'woff' || str === 'woff2') ext = 'font'
					}
					return `${packPath}${ext}/[name].[ext]`
				},
			},
		},
	},
	server: {
		https: false,
		host: '0.0.0.0',
		port: 3001,
		proxy: {
			'/proxy': {
				target: 'http://192.168.77.150:5000',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/proxy/, ''),
			},
		},
	},
})
