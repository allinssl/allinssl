/**
 * @type {import('stylelint').Config}
 */
export default {
	// 继承配置
	extends: [
		'stylelint-config-standard',
		'stylelint-config-prettier',
		'stylelint-config-html',
		'stylelint-config-tailwindcss',
	],
	// 插件
	plugins: ['stylelint-order'],
	// 规则
	rules: {
		'declaration-block-trailing-semicolon': null,
		'no-descending-specificity': null,
		// TailwindCSS 规则
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer'],
			},
		],
		// 缩进 2 空格
		indentation: 2,
		// 颜色值小写
		'color-hex-case': 'lower',
		// 禁止空块
		'block-no-empty': true,
		// 颜色6位长度
		'color-hex-length': 'long',
		// 兼容自定义标签名
		'selector-type-no-unknown': [
			true,
			{
				ignoreTypes: [],
			},
		],
		// 忽略特殊伪类选择器
		'selector-pseudo-element-no-unknown': [
			true,
			{
				ignorePseudoElements: ['v-deep', ':deep'],
			},
		],
		// 禁止空注释
		'comment-no-empty': true,
		// 禁止简写属性覆盖相关普通属性
		'declaration-block-no-shorthand-property-overrides': true,
		// 禁止重复的属性
		'declaration-block-no-duplicate-properties': true,
		// 属性的排序
		'order/properties-order': [
			// 定位
			{
				groupName: 'positioning',
				emptyLineBefore: 'always',
				properties: ['position', 'top', 'right', 'bottom', 'left', 'z-index'],
			},
			// 布局
			{
				groupName: 'layout',
				emptyLineBefore: 'always',
				properties: [
					'display',
					'flex',
					'flex-direction',
					'flex-wrap',
					'flex-basis',
					'flex-grow',
					'flex-shrink',
					'flex-flow',
					'grid',
					'grid-template-columns',
					'grid-template-rows',
					'grid-template-areas',
					'grid-auto-columns',
					'grid-auto-rows',
					'grid-auto-flow',
					'gap',
					'justify-content',
					'align-items',
					'align-content',
					'order',
					'float',
					'clear',
				],
			},
			// 盒模型
			{
				groupName: 'box-model',
				emptyLineBefore: 'always',
				properties: [
					'width',
					'min-width',
					'max-width',
					'height',
					'min-height',
					'max-height',
					'margin',
					'margin-top',
					'margin-right',
					'margin-bottom',
					'margin-left',
					'padding',
					'padding-top',
					'padding-right',
					'padding-bottom',
					'padding-left',
					'box-sizing',
					'overflow',
					'overflow-x',
					'overflow-y',
				],
			},
			// 排版
			{
				groupName: 'typography',
				emptyLineBefore: 'always',
				properties: [
					'font',
					'font-family',
					'font-size',
					'font-weight',
					'font-style',
					'font-variant',
					'font-size-adjust',
					'line-height',
					'letter-spacing',
					'text-align',
					'text-transform',
					'text-decoration',
					'text-indent',
					'text-overflow',
					'text-shadow',
					'white-space',
					'word-break',
					'word-spacing',
					'word-wrap',
					'color',
				],
			},
			// 视觉效果
			{
				groupName: 'visual',
				emptyLineBefore: 'always',
				properties: [
					'background',
					'background-color',
					'background-image',
					'background-repeat',
					'background-position',
					'background-size',
					'border',
					'border-width',
					'border-style',
					'border-color',
					'border-radius',
					'box-shadow',
					'opacity',
					'visibility',
					'cursor',
					'pointer-events',
				],
			},
			// 动画
			{
				groupName: 'animation',
				emptyLineBefore: 'always',
				properties: [
					'transition',
					'transition-property',
					'transition-duration',
					'transition-timing-function',
					'transition-delay',
					'animation',
					'animation-name',
					'animation-duration',
					'animation-timing-function',
					'animation-delay',
					'animation-iteration-count',
					'animation-direction',
					'animation-fill-mode',
					'animation-play-state',
					'transform',
					'transform-origin',
				],
			},
		],
	},
}
