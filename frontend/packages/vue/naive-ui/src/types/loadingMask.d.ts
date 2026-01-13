/**
 * 加载遮罩层配置选项接口
 */
export interface LoadingMaskOptions {
	/** 加载提示文本，显示在加载图标下方 */
	text?: string
	/** 加载描述文本，用于详细说明 */
	description?: string
	/** 加载图标颜色 */
	color?: string
	/** 加载图标大小 */
	size?: 'small' | 'medium' | 'large'
	/** 加载图标线条粗细 */
	stroke?: string
	/** 是否显示加载遮罩 */
	show?: boolean
	/** 是否全屏显示，默认为true */
	fullscreen?: boolean
	/** 遮罩背景色，支持rgba格式设置透明度 */
	background?: string
	/** 自定义样式对象 */
	customStyle?: Record<string, unknown>
	/** 自定义类名 */
	customClass?: string
	/** NSpin组件的props配置 */
	spinProps?: SpinProps
	/** 目标元素，默认为body。可以是CSS选择器或HTML元素 */
	target?: string | HTMLElement
	/** 遮罩层的z-index值 */
	zIndex?: number
	/** 关闭回调函数 */
	onClose?: () => void
}

/**
 * 加载遮罩层实例接口
 */
export interface LoadingMaskInstance {
	/** 打开加载遮罩 */
	open: (options?: LoadingMaskOptions) => void
	/** 关闭加载遮罩 */
	close: () => void
	/** 更新加载遮罩配置 */
	update: (options: LoadingMaskOptions) => void
	/** 销毁加载遮罩实例 */
	destroy: () => void
}
