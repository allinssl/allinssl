/**
 * 渐变进度条组件
 *
 * @description
 * 一个支持渐变色的横向进度条组件，可自定义进度文本和样式
 *
 * @example
 * ```tsx
 * // 基础用法
 * <HorizontalProgress :value="50" />
 *
 * // 自定义颜色
 * <HorizontalProgress
 *   :value="75"
 *   color="linear-gradient(to right, #108ee9, #87d068)"
 * />
 *
 * // 自定义进度文本
 * <HorizontalProgress :value="30">
 *   <template #default>30%</template>
 * </HorizontalProgress>
 * ```
 *
 * @property {number} value - 进度值(0-100)
 * @property {string} progressTextStyle - 进度文本的自定义样式
 * @property {string} color - 进度条的渐变色，支持 CSS 渐变语法
 *
 * @slots
 * default - 默认插槽，用于自定义进度条内的内容
 *
 * @requires vue
 * @requires naive-ui
 * @requires @vueuse/core
 */
import { defineComponent, ref, onMounted, useTemplateRef } from 'vue'
import style from './index.module.css'
import { useThemeVars } from 'naive-ui'
import { useResizeObserver, ResizeObserverEntry } from '@vueuse/core'

export default defineComponent({
	props: {
		value: {
			type: Number,
			required: true,
		},
		progressTextStyle: {
			type: String,
			default: '',
		},
		color: {
			type: String,
			default: 'linear-gradient(to left, #ff0000 0%, #ff7f00 50%, #20a53a 100%)',
		},
	},
	setup(props, { slots }) {
		const proContainer = useTemplateRef<HTMLElement | null>('proContainer')
		const provWidth = ref(0)
		const themeVars = useThemeVars()

		onMounted(() => {
			if (proContainer.value) {
				provWidth.value = proContainer.value.clientWidth
			}
		})
		useResizeObserver(proContainer, (entries) => {
			const entry = entries[0] as ResizeObserverEntry
			const { width } = entry.contentRect
			provWidth.value = width
		})

		return () => (
			<div
				class={style['pro-container']}
				style={{ width: '100%', backgroundColor: themeVars.value.progressRailColor }}
				ref="proContainer"
			>
				<div class={style['probg']} style={{ width: `${props.value}%` }}>
					<div class={style['prov']} style={{ width: `${provWidth.value}px`, background: props.color }}></div>
					<div class={style['proText']} style={props.progressTextStyle}>
						{slots.default ? slots.default() : ''}
					</div>
				</div>
			</div>
		)
	},
})
