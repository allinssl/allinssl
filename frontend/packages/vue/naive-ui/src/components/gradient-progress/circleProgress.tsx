/**
 * 一个可自定义的环形进度条组件，支持渐变色效果。
 * 
 * @component CircleProgressCSS
 * 
 * @example 基础用法
 * ```tsx
 * <CircleProgressCSS
 *   percent={75}
 *   size={200}
 *   strokeWidth={20}
 *   progressColor="#2ba0fb"
 * />
 * ```
 * 
 * @example 使用渐变色
 * ```tsx
 * <CircleProgressCSS
 *   percent={75}
 *   progressColor={[
 *     { offset: 0, color: '#ff0000' },
 *     { offset: 1, color: '#00ff00' }
 *   ]}
 * />
 * ```
 * 
 * @props
 * @prop {number} percent - 进度百分比(0-100)
 * @prop {number} [size=200] - 圆环大小(像素)
 * @prop {number} [strokeWidth=20] - 进度条宽度
 * @prop {string} [textSize='24px'] - 百分比文字大小
 * @prop {string} [trackColor='#e5f1fa'] - 背景轨道颜色
 * @prop {string} [textColor='#333'] - 百分比文字颜色
 * @prop {string} [holeColor='var(--n-color-modal)'] - 中心圆孔颜色
 * @prop {string|ColorStop[]} [progressColor='#2ba0fb'] - 进度条颜色或渐变色配置
 * @prop {boolean} [rounded=true] - 是否使用圆角
 * @prop {boolean} [animated=true] - 是否启用动画效果
 * 
 * @interface ColorStop
 * @property {number} offset - 渐变色位置(0-1)
 * @property {string} color - 十六进制颜色值(#RRGGBB)
 */
import { defineComponent, ref, computed, watch, PropType, CSSProperties } from 'vue'
import style from './index.module.css'

interface ColorStop {
	offset: number
	color: string
}


function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const match = hex
		.trim()
		.toLowerCase()
		.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
	if (!match) return null
	return {
		r: parseInt(match[1] as string, 16),
		g: parseInt(match[2] as string, 16),
		b: parseInt(match[3] as string, 16),
	}
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
	const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180)
	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	}
}

function easeOutCubic(t: number): number {
	return 1 - Math.pow(1 - t, 3)
}

export default defineComponent({
	name: 'CircleProgressCSS',
	props: {
		percent: {
			type: Number,
			required: true,
			validator: (v: number) => v >= 0 && v <= 100,
		},
		size: {
			type: Number,
			default: 200,
		},
		strokeWidth: {
			type: Number,
			default: 20,
		},
		textSize: {
			type: String,
			default: '24px',
		},
		trackColor: {
			type: String,
			default: '#e5f1fa',
		},
		textColor: {
			type: String,
			default: '#333',
		},
		holeColor: {
			type: String,
			default: 'var(--n-color-modal)',
		},
		progressColor: {
			type: [String, Array] as PropType<string | ColorStop[]>,
			default: '#2ba0fb',
		},
		rounded: {
			type: Boolean,
			default: true,
		},
		animated: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		const animatedPercent = ref(props.percent)
		// 判断是否支持conic-gradient
		const supportsConicGradient = () => CSS.supports('background-image', 'conic-gradient(red, yellow)')

		watch(
			() => props.percent,
			(newVal) => {
				if (!props.animated) {
					animatedPercent.value = newVal
					return
				}
				const duration = 300
				const frameRate = 60
				const frameCount = Math.round(duration / (1000 / frameRate))
				const start = animatedPercent.value
				const delta = newVal - start

				let frame = 0
				const animate = () => {
					frame++
					const progress = frame / frameCount
					animatedPercent.value = start + delta * easeOutCubic(progress)
					if (frame < frameCount) {
						requestAnimationFrame(animate)
					}
				}
				animate()
			},
			{ immediate: true },
		)

		const conicGradient = computed(() => {
			if (!supportsConicGradient() && Array.isArray(props.progressColor) && props.progressColor.length > 0) {
				return (props.progressColor[0] as ColorStop).color
			}
			if (typeof props.progressColor === 'string') {
				return `conic-gradient(${props.progressColor} 0% 100%)`
			}
			const stops = (props.progressColor as ColorStop[]).map((s) => `${s.color} ${s.offset * 100}%`).join(', ')
			return `conic-gradient(${stops})`
		})

		const getStartColor = (): string => {
			if (animatedPercent.value === 0) return 'transparent'
			if (typeof props.progressColor === 'string') return props.progressColor
			return (props.progressColor[0] as ColorStop).color
		}

		const getEndColor = (): string => {
			if (typeof props.progressColor === 'string') return props.progressColor
			if (!supportsConicGradient() && Array.isArray(props.progressColor) && props.progressColor.length > 0) {
				return (props.progressColor[0] as ColorStop).color
			}
			if (animatedPercent.value === 0 || animatedPercent.value === 100) return 'transparent'

			const percent = animatedPercent.value / 100
			const colorStops = props.progressColor as ColorStop[]

			let prev = colorStops[0]
			let next = colorStops[colorStops.length - 1]

			for (let i = 0; i < colorStops.length - 1; i++) {
				if (percent >= (colorStops[i] as ColorStop).offset && percent <= (colorStops[i + 1] as ColorStop).offset) {
					prev = colorStops[i]
					next = colorStops[i + 1]
					break
				}
			}

			const range = (next as ColorStop).offset - (prev as ColorStop).offset
			const localPercent = range === 0 ? 0 : (percent - (prev as ColorStop).offset) / range

			const prevRGB = hexToRgb((prev as ColorStop).color)
			const nextRGB = hexToRgb((next as ColorStop).color)
			if (!prevRGB || !nextRGB) return (next as ColorStop).color

			const r = Math.round(prevRGB.r + (nextRGB.r - prevRGB.r) * localPercent)
			const g = Math.round(prevRGB.g + (nextRGB.g - prevRGB.g) * localPercent)
			const b = Math.round(prevRGB.b + (nextRGB.b - prevRGB.b) * localPercent)

			return `rgb(${r}, ${g}, ${b})`
		}

		const capPosition = computed(() => {
			const angle = (animatedPercent.value / 100) * 360
			const center = props.size / 2
			const radius = center - props.strokeWidth / 2
			const pos = polarToCartesian(center, center, radius, angle)
			return {
				left: `${pos.x}px`,
				top: `${pos.y}px`,
			}
		})

		const containerStyle = computed<CSSProperties>(() => ({
			width: `${props.size}px`,
			height: `${props.size}px`,
			'--track-color': props.trackColor,
			'--text-color': props.textColor,
			'--text-size': props.textSize,
			'--percent': (animatedPercent.value / 100).toFixed(2),
			'--progress-gradient': conicGradient.value,
			'--stroke-width': `${props.strokeWidth}px`,
			'--cap-start-color': getStartColor(),
			'--cap-end-color': getEndColor(),
			'--hole-color': props.holeColor,
		}))

		const displayText = computed(() => `${Math.round(animatedPercent.value)}%`)

		return () => (
			<div class={style['circle-progress']} style={containerStyle.value}>
				<div class={style['circle-track']} />
				<div class={style['circle-fill']} />
				<div class={style['circle-hole']} />
				<div class={[style['circle-cap'], style['start-cap']].join(' ')} />
				<div class={[style['circle-cap'], style['end-cap']].join(' ')} style={capPosition.value} />
				<div class={style['circle-text']}>{displayText.value}</div>
			</div>
		)
	},
})
