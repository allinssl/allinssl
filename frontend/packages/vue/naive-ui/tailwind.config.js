/** @type {import('tailwindcss').Config} */
export default {
	// 配置需要处理的文件
	content: [
		'./index.html',
		'./src/**/*.{vue,js,ts,jsx,tsx}', // 处理所有 Vue、JS、TS、JSX、TSX 文件
	],
	// 主题配置
	theme: {
		extend: {},
	},
	// 插件配置
	plugins: [],
}
