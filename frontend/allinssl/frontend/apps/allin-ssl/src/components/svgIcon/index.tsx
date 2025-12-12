import { defineComponent, computed, PropType } from 'vue'

/**
 * @description Svg 图标组件的属性定义
 */
interface SvgIconProps {
	/**
	 * 图标的尺寸，例如 '1.8rem', '24px'
	 * @default '1.8rem'
	 */
	size: string
	/**
	 * 图标的名称 (不包含 'icon-' 前缀)
	 * @required
	 */
	icon: string
	/**
	 * 图标的颜色
	 * @default '' (继承父级颜色)
	 */
	color?: string
}

/**
 * @description SVG 图标组件
 * @example
 * <SvgIcon icon="search" size="20px" color="red" />
 */
export default defineComponent({
	name: 'SvgIcon',
	props: {
		/**
		 * 图标的名称 (不包含 'icon-' 前缀)
		 */
		icon: {
			type: String as PropType<string>,
			required: true,
		},
		/**
		 * 图标的颜色
		 */
		color: {
			type: String as PropType<string>,
			default: '',
		},
		/**
		 * 图标的尺寸，例如 '1.8rem', '24px'
		 */
		size: {
			type: String as PropType<string>,
			default: '1.8rem',
		},
	},
	setup(props: SvgIconProps) {
		const iconName = computed(() => `#icon-${props.icon}`)
		return () => (
			<svg
				class="relative inline-block align-[-0.2rem]" // 样式类名，符合Tailwind CSS使用方式
				style={{ width: props.size, height: props.size }}
				aria-hidden="true"
			>
				<use xlinkHref={iconName.value} fill={props.color} />
			</svg>
		)
	},
})
