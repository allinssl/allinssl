import { defineComponent, onMounted, ref, watch, PropType, onUnmounted } from 'vue'

/**
 * 渐变色停止点接口定义
 * @interface ColorStop
 * @property {number} offset - 渐变停止点位置（0-1）
 * @property {string} color - 渐变颜色值
 */
interface ColorStop {
	offset: number
	color: string
}

/**
 * 文字位置类型
 */
type TextPosition = 'front' | 'back' | 'follow'

/**
 * 自定义插槽参数接口
 */
interface SlotProps {
	percent: number
	color: string
}

/**
 * 环形进度条组件
 * 支持自定义大小、颜色、进度和渐变色
 * @component CircleProgress
 * @example
 * ```vue
 * <!-- 基础用法 -->
 * <CircleProgress :percent="75" />
 *
 * <!-- 横向进度条 -->
 * <CircleProgress type="horizontal" :percent="75" />
 *
 * <!-- 使用渐变色 -->
 * <CircleProgress
 *   :percent="75"
 *   :progress-color="[
 *     { offset: 0, color: '#ff0000' },
 *     { offset: 0.5, color: '#00ff00' },
 *     { offset: 1, color: '#0000ff' }
 *   ]"
 * />
 *
 * <!-- 自定义样式 -->
 * <CircleProgress
 *   :percent="75"
 *   :size="200"
 *   :stroke-width="10"
 *   :text-color-follow-progress="true"
 * />
 * ```
 */
export const CircleProgress = defineComponent({
	name: 'CircleProgress',
	props: {
		/**
		 * 进度条类型
		 * @default 'circle'
		 * @type {'circle' | 'horizontal'}
		 */
		type: {
			type: String as PropType<'circle' | 'horizontal'>,
			default: 'circle',
		},
		/**
		 * 进度值，范围 0-100
		 * @default 0
		 * @type {number}
		 */
		percent: {
			type: Number,
			default: 0,
			validator: (value: number) => value >= 0 && value <= 100,
		},
		/**
		 * 组件大小，单位像素
		 * @default 300
		 * @type {number}
		 */
		size: {
			type: Number,
			default: 300,
		},
		/**
		 * 进度文字大小
		 * @default 30
		 * @type {number}
		 */
		textSize: {
			type: Number,
			default: 30,
		},
		/**
		 * 进度条宽度
		 * @default 20
		 * @type {number}
		 */
		strokeWidth: {
			type: Number,
			default: 10,
		},
		/**
		 * 轨道颜色
		 * @default '#e5f1fa'
		 * @type {string}
		 */
		trackColor: {
			type: String,
			default: '#e5f1fa',
		},
		/**
		 * 进度条颜色，支持纯色或渐变色数组
		 * @default '#2ba0fb'
		 * @type {string | ColorStop[]}
		 */
		progressColor: {
			type: [String, Array] as PropType<string | ColorStop[]>,
			default: '#2ba0fb',
		},
		/**
		 * 进度文字颜色
		 * @default '#333'
		 * @type {string}
		 */
		textColor: {
			type: String,
			default: '#333',
		},
		/**
		 * 文字颜色是否跟随进度条颜色变化
		 * @default false
		 * @type {boolean}
		 */
		textColorFollowProgress: {
			type: Boolean,
			default: false,
		},
		/**
		 * 起始角度（弧度）
		 * @default -Math.PI / 2
		 * @type {number}
		 */
		startAngle: {
			type: Number,
			default: -Math.PI / 2, // 默认从12点钟方向开始
		},
		/**
		 * 是否顺时针旋转
		 * @default true
		 * @type {boolean}
		 */
		clockwise: {
			type: Boolean,
			default: true,
		},
		/**
		 * 动画过渡速度（0-1之间，值越大动画越快）
		 * @default 0.1
		 * @type {number}
		 */
		animationSpeed: {
			type: Number,
			default: 0.1,
			validator: (value: number) => value > 0 && value <= 1,
		},
		/**
		 * 组件宽度，单位像素（仅横向进度条生效）
		 * @default 300
		 * @type {number}
		 */
		width: {
			type: Number,
			default: 300,
		},
		/**
		 * 组件高度，单位像素（仅横向进度条生效）
		 * @default 20
		 * @type {number}
		 */
		height: {
			type: Number,
			default: 20,
		},
		/**
		 * 是否启用圆角
		 * @default true
		 * @type {boolean}
		 */
		rounded: {
			type: Boolean,
			default: true,
		},
		/**
		 * 进度条颜色是否跟随进度变化
		 * @default false
		 * @type {boolean}
		 */
		colorFollowProgress: {
			type: Boolean,
			default: false,
		},
		/**
		 * 横向进度条文字位置
		 * @default 'follow'
		 * @type {'front' | 'back' | 'follow'}
		 */
		textPosition: {
			type: String as PropType<TextPosition>,
			default: 'follow',
		},
		/**
		 * 自定义进度文字插槽
		 * @type {(props: SlotProps) => any}
		 */
		progressText: {
			type: Function as PropType<(props: SlotProps) => JSX.Element>,
			default: undefined,
		},
	},
	setup(props) {
		const canvasRef = ref<HTMLCanvasElement | null>(null) // 画布引用
		const currentNum = ref(0) // 当前进度
		const targetNum = ref(0) // 目标进度
		const animationFrame = ref<number | null>(null) // 动画帧

		/**
		 * 计算圆角导致的进度偏差值
		 * @returns {number} 角度偏差值（弧度）
		 * @description
		 * 1. 计算整个圆的长度，以进度线段中心作为圆的长度
		 * 2. 获取进度线段线帽的半径（线段宽度的一半）
		 * 3. 计算线帽旋转需要的角度偏差
		 * 4. 如果未启用圆角或未使用渐变色，则返回0
		 * 5. 当圆弧长度大于圆的长度时，根据进度值计算额外偏移
		 */
		const roundDeviation = (): number => {
			if (props.type === 'horizontal') return 0
			// 如果未启用圆角或未使用渐变色，返回0
			if (!props.rounded || !Array.isArray(props.progressColor) || props.percent === 100) {
				return 0
			}

			// 计算圆的半径（以进度线段中心为基准）
			const radius = (props.size - props.strokeWidth) / 2

			// 获取线帽半径（线段宽度的一半）
			const capRadius = props.strokeWidth / 2

			// 计算线帽旋转需要的角度偏差
			// 使用弧长公式：弧长 = 半径 * 角度
			// 因此：角度 = 弧长 / 半径
			// 这里使用线帽半径作为弧长，因为线帽旋转时走过的距离等于线帽半径
			const deviation = capRadius / radius

			// 计算当前圆的长度
			// const circleLength = 2 * Math.PI * radius

			// const progressLength = circleLength * (props.percent / 100) + props.strokeWidth

			// 如果当前圆弧的长度大于圆的长度，且进度小于100%，则增加偏差
			// if (progressLength > circleLength && props.percent <= 100) {
			// 	deviation = deviation + (progressLength - circleLength) / radius
			// }

			return deviation
		}

		/**
		 * 创建渐变对象
		 * @param ctx - Canvas上下文
		 * @param centerX - 圆心X坐标
		 * @param centerY - 圆心Y坐标
		 * @param colorStops - 渐变色停止点数组
		 * @returns {CanvasGradient} 锥形渐变对象
		 * @description
		 * 创建一个锥形渐变，并添加颜色停止点。
		 * 确保渐变的起点和终点颜色正确，使渐变效果更加平滑。
		 */
		const createGradient = (
			ctx: CanvasRenderingContext2D,
			centerX: number,
			centerY: number,
			colorStops: ColorStop[],
		): CanvasGradient => {
			const deviation = roundDeviation()

			console.log(deviation)
			// 创建锥形渐变，起始角度为-90度（12点钟方向），增加一个偏差值，解决进度显示不完整的问题，同时排除显卡
			const gradient = ctx.createConicGradient(props.startAngle - deviation, centerX, centerY)

			// 添加颜色停止点
			colorStops.forEach((stop) => {
				gradient.addColorStop(stop.offset, stop.color)
			})

			// 确保渐变闭合
			const firstStop = colorStops[0]
			// 获取最后一个颜色停止点
			const lastStop = colorStops[colorStops.length - 1]
			console.log(firstStop, lastStop)
			// 如果第一个颜色停止点不是0，则添加一个0偏移的颜色停止点
			if (firstStop && firstStop.offset !== 0) {
				gradient.addColorStop(0, firstStop.color)
			}
			// 如果最后一个颜色停止点不是1，则添加一个1偏移的颜色停止点
			if (lastStop && lastStop.offset !== 1) {
				gradient.addColorStop(1, lastStop.color)
			}

			return gradient
		}

		/**
		 * 获取当前进度的颜色或渐变
		 * @param ctx - Canvas上下文
		 * @param centerX - 圆心X坐标
		 * @param centerY - 圆心Y坐标
		 * @returns {string | CanvasGradient} 颜色值或渐变对象
		 * @description
		 * 根据progressColor属性的类型返回对应的颜色或渐变对象。
		 * 如果是字符串则返回纯色，如果是数组则创建渐变。
		 */
		const getProgressColor = (
			ctx: CanvasRenderingContext2D,
			centerX: number,
			centerY: number,
		): string | CanvasGradient => {
			if (!Array.isArray(props.progressColor)) {
				return props.progressColor
			}

			// 如果是横向进度条，使用线性渐变
			if (props.type === 'horizontal') {
				const gradient = ctx.createLinearGradient(0, centerY, props.width, centerY)
				props.progressColor.forEach((stop) => {
					gradient.addColorStop(stop.offset, stop.color)
				})
				return gradient
			}

			// 圆形进度条使用锥形渐变
			return createGradient(ctx, centerX, centerY, props.progressColor)
		}

		/**
		 * 获取当前进度的颜色
		 * @param progress - 当前进度值（0-100）
		 * @returns {string} 当前进度的颜色
		 */
		const getCurrentProgressColor = (progress: number): string => {
			// 如果不是渐变色数组，直接返回颜色
			if (!Array.isArray(props.progressColor)) {
				return typeof props.progressColor === 'string' ? props.progressColor : props.textColor
			}

			// 如果颜色停止点为空，返回默认颜色
			const colorStops = props.progressColor as ColorStop[]
			if (colorStops.length === 0) {
				return props.textColor
			}

			// 如果进度达到100%，返回最后一个颜色
			if (progress >= 100) {
				const lastStop = colorStops[colorStops.length - 1]
				return lastStop?.color || props.textColor
			}

			// 将进度转换为0-1之间的值
			const normalizedProgress = progress / 100

			// 找到当前进度所在的两个颜色停止点
			for (let i = 0; i < colorStops.length - 1; i++) {
				const currentStop = colorStops[i]
				const nextStop = colorStops[i + 1]

				if (
					currentStop &&
					nextStop &&
					normalizedProgress >= currentStop.offset &&
					normalizedProgress <= nextStop.offset
				) {
					// 计算两个颜色之间的插值
					const range = nextStop.offset - currentStop.offset
					const ratio = (normalizedProgress - currentStop.offset) / range
					return currentStop.color
				}
			}

			// 如果进度超出范围，返回最后一个颜色
			const lastStop = colorStops[colorStops.length - 1]
			return lastStop?.color || props.textColor
		}

		/**
		 * 格式化进度显示值
		 * @param value - 进度值
		 * @returns {string} 格式化后的进度值
		 */
		const formatProgressValue = (value: number): string => {
			// 如果进度达到100，直接返回100%
			if (value >= 100) return '100%'

			// 将进度值转换为两位小数
			// const decimalValue = Math.round(value * 100) / 100
			// 如果是整数，直接返回
			if (Number.isInteger(value)) {
				return `${value}%`
			}
			// 否则返回两位小数
			return `${value.toFixed(2)}%`
		}

		/**
		 * 获取文字位置样式
		 * @returns {object} 文字位置样式对象
		 */
		const getTextPositionStyle = (): object => {
			if (props.type !== 'horizontal') {
				return {
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -50%)',
				}
			}

			const progress = currentNum.value / 100
			const width = props.width
			const textWidth = 60 // 预估文字宽度

			// 根据文字位置类型返回对应的样式
			switch (props.textPosition) {
				// 文字在进度条前面
				case 'front':
					return {
						left: `${textWidth / 2}px`,
						top: '50%',
						transform: 'translateY(-50%)',
					}
				// 文字在进度条后面
				case 'back':
					return {
						right: `${textWidth / 2}px`,
						top: '50%',
						transform: 'translateY(-50%)',
					}
				// 文字跟随进度条
				case 'follow':
				default:
					return {
						left: `${Math.max(textWidth / 2, Math.min(width - textWidth / 2, width * progress))}px`, // 文字位置
						top: '50%',
						transform: 'translateX(-50%) translateY(-50%)',
					}
			}
		}

		/**
		 * 绘制圆弧
		 * @param ctx - Canvas上下文
		 * @param color - 填充颜色或渐变
		 * @param x - 圆心X坐标
		 * @param y - 圆心Y坐标
		 * @param radius - 半径
		 * @param start - 起始角度（弧度）
		 * @param end - 结束角度（弧度）
		 * @description
		 * 使用Canvas绘制圆弧，支持纯色和渐变填充。
		 * 使用butt线帽和miter连接样式，确保线条无圆角。
		 */
		const drawCircle = (
			ctx: CanvasRenderingContext2D,
			color: string | CanvasGradient,
			x: number,
			y: number,
			radius: number,
			start: number,
			end: number,
		) => {
			ctx.save() // 保存当前状态

			// 设置线条样式
			ctx.lineCap = props.rounded ? 'round' : 'butt' // 根据rounded属性设置线帽
			ctx.lineJoin = props.rounded ? 'round' : 'miter' // 根据rounded属性设置连接样式
			ctx.lineWidth = props.strokeWidth // 设置线宽
			ctx.strokeStyle = color // 设置线条颜色

			// 创建路径
			ctx.beginPath() // 开始绘制路径
			ctx.arc(x, y, radius, start, end, !props.clockwise) // 绘制圆弧

			// 绘制线条
			ctx.stroke() // 绘制线条
			ctx.closePath() // 关闭路径

			ctx.restore() // 恢复状态
		}

		/**
		 * 绘制横向进度条
		 * @param ctx - Canvas上下文
		 * @param color - 填充颜色或渐变
		 * @param x - 起始X坐标
		 * @param y - 起始Y坐标
		 * @param width - 宽度
		 * @param height - 高度
		 * @param progress - 进度值（0-1）
		 * @description
		 * 使用Canvas绘制横向进度条，支持纯色和渐变填充。
		 */
		const drawHorizontal = (
			ctx: CanvasRenderingContext2D,
			color: string | CanvasGradient,
			x: number,
			y: number,
			width: number,
			height: number,
			progress: number,
		) => {
			ctx.save()

			// 设置线条样式
			ctx.lineCap = props.rounded ? 'round' : 'butt'
			ctx.lineJoin = props.rounded ? 'round' : 'miter'
			ctx.lineWidth = height
			ctx.strokeStyle = color

			// 计算圆角半径
			const radius = props.rounded ? height / 2 : 0

			// 计算实际进度宽度，考虑圆角
			const actualWidth = Math.max(radius * 2, width * progress)

			// 绘制进度条
			ctx.beginPath()
			// 从圆角中心点开始绘制
			ctx.moveTo(x + radius, y + height / 2)
			// 到圆角中心点结束
			ctx.lineTo(x + actualWidth - radius, y + height / 2)
			ctx.stroke()
			ctx.closePath()

			// 只在启用圆角时绘制起点和终点圆角
			if (props.rounded) {
				// 绘制起点圆角
				ctx.beginPath()
				ctx.arc(x + radius, y + height / 2, radius, -Math.PI / 2, Math.PI / 2)
				ctx.fillStyle = color
				ctx.fill()
				ctx.closePath()

				// 只在进度大于0时绘制终点圆角
				if (progress > 0) {
					ctx.beginPath()
					ctx.arc(x + actualWidth - radius, y + height / 2, radius, Math.PI / 2, -Math.PI / 2)
					ctx.fillStyle = color
					ctx.fill()
					ctx.closePath()
				}
			}

			ctx.restore()
		}

		/**
		 * 执行动画绘制
		 * @description
		 * 使用requestAnimationFrame实现平滑的进度动画。
		 * 支持高DPI设备，确保显示清晰。
		 * 包含背景轨道、进度条和进度文字的绘制。
		 */
		const animate = () => {
			const canvas = canvasRef.value
			if (!canvas) return

			const ctx = canvas.getContext('2d')
			if (!ctx) return

			// 设置画布的实际尺寸为显示尺寸的2倍，以支持高DPI设备
			const dpr = window.devicePixelRatio || 1
			const displayWidth = props.type === 'horizontal' ? props.width : props.size
			const displayHeight = props.type === 'horizontal' ? props.height : props.size
			canvas.width = displayWidth * dpr
			canvas.height = displayHeight * dpr
			ctx.scale(dpr, dpr)

			const draw = () => {
				// 平滑过渡到目标值
				const diff = targetNum.value - currentNum.value
				if (Math.abs(diff) > 0.1) {
					currentNum.value += diff * props.animationSpeed
					animationFrame.value = requestAnimationFrame(draw)
				} else {
					currentNum.value = targetNum.value
				}

				ctx.clearRect(0, 0, displayWidth, displayHeight)

				if (props.type === 'horizontal') {
					// 绘制背景轨道
					drawHorizontal(ctx, props.trackColor, 0, 0, displayWidth, displayHeight, 1)

					// 获取当前进度的颜色或渐变
					const progressColor = getProgressColor(ctx, displayWidth / 2, displayHeight / 2)

					// 绘制进度条
					drawHorizontal(ctx, progressColor, 0, 0, displayWidth, displayHeight, currentNum.value / 100)
				} else {
					// 原有的圆形进度条绘制逻辑
					const centerX = props.size / 2
					const centerY = props.size / 2
					const radius = (props.size - props.strokeWidth) / 2

					// 绘制背景轨道
					drawCircle(ctx, props.trackColor, centerX, centerY, radius, 0, 2 * Math.PI)

					// 获取当前进度的颜色或渐变
					const progressColor = getProgressColor(ctx, centerX, centerY)

					// 绘制进度条
					const progressAngle = ((2 * currentNum.value) / 100) * Math.PI
					const adjustedStartAngle = props.startAngle
					const adjustedEndAngle = props.startAngle + progressAngle

					// 绘制进度条
					drawCircle(ctx, progressColor, centerX, centerY, radius, adjustedStartAngle, adjustedEndAngle)
				}
			}

			draw()
		}

		// 组件挂载时初始化
		onMounted(() => {
			targetNum.value = props.percent
			currentNum.value = props.percent
			animate()
		})

		// 监听进度值变化
		watch(
			() => props.percent,
			(newValue) => {
				// 限制进度值不超过100
				const limitedValue = Math.min(newValue, 100)
				// 如果已经达到100%，不再更新
				if (currentNum.value >= 100 && limitedValue >= 100) {
					return
				}
				targetNum.value = limitedValue
				// 取消之前的动画帧
				if (animationFrame.value) {
					cancelAnimationFrame(animationFrame.value)
					animationFrame.value = null
				}
				animate()
			},
		)

		// 组件卸载时清理动画帧
		onUnmounted(() => {
			if (animationFrame.value) {
				cancelAnimationFrame(animationFrame.value)
				animationFrame.value = null
			}
		})

		return () => {
			const currentColor = getCurrentProgressColor(currentNum.value)
			const textContent = props.progressText
				? props.progressText({ percent: Math.round(currentNum.value), color: currentColor })
				: formatProgressValue(currentNum.value)

			return (
				<div
					style={{
						width: props.type === 'horizontal' ? `${props.width}px` : `${props.size}px`,
						height: props.type === 'horizontal' ? `${props.height}px` : `${props.size}px`,
						position: 'relative',
					}}
				>
					<canvas
						ref={canvasRef}
						style={{
							width: props.type === 'horizontal' ? `${props.width}px` : `${props.size}px`,
							height: props.type === 'horizontal' ? `${props.height}px` : `${props.size}px`,
							display: 'block',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							...getTextPositionStyle(),
							fontSize: props.type === 'horizontal' ? `${props.height * 0.8}px` : `${props.size / 7.5}px`,
							fontFamily: 'Helvetica',
							color: props.textColorFollowProgress ? currentColor : props.textColor,
						}}
					>
						{textContent}
					</div>
				</div>
			)
		}
	},
})

export default CircleProgress
