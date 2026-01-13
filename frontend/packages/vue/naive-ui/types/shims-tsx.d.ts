import { VNode } from 'vue'

declare global {
	namespace JSX {
		interface Element extends VNode {}

		interface ElementClass {
			$props: {}
		}

		interface IntrinsicAttributes {
			key?: string | number
			ref?: string | ((el: any) => void)
		}

		interface IntrinsicElements {
			// 基础元素
			div: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				onClick?: (event: MouseEvent) => void
				onMouseenter?: (event: MouseEvent) => void
				onMouseleave?: (event: MouseEvent) => void
				[key: string]: any
			}
			span: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			p: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			// 表单元素
			input: {
				type?: string
				value?: string | number
				placeholder?: string
				onChange?: (event: Event) => void
				onInput?: (event: Event) => void
				onFocus?: (event: FocusEvent) => void
				onBlur?: (event: FocusEvent) => void
				disabled?: boolean
				[key: string]: any
			}
			button: {
				type?: 'button' | 'submit' | 'reset'
				disabled?: boolean
				onClick?: (event: MouseEvent) => void
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			// 列表元素
			ul: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			li: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			// 表格元素
			table: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				border?: string | number
				cellPadding?: string | number
				cellSpacing?: string | number
				[key: string]: any
			}
			tr: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			td: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				colSpan?: number
				rowSpan?: number
				[key: string]: any
			}
			th: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				colSpan?: number
				rowSpan?: number
				scope?: 'col' | 'row'
				[key: string]: any
			}
			// 表单容器
			form: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				onSubmit?: (event: Event) => void
				method?: string
				action?: string
				[key: string]: any
			}
			// 图片
			img: {
				src: string
				alt?: string
				width?: string | number
				height?: string | number
				loading?: 'eager' | 'lazy'
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			// 链接
			a: {
				href?: string
				target?: '_blank' | '_self' | '_parent' | '_top'
				rel?: string
				className?: string
				style?: string | { [key: string]: string | number }
				onClick?: (event: MouseEvent) => void
				[key: string]: any
			}
			// 标题元素
			h1: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			h2: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			h3: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			// 其他常用元素
			label: {
				htmlFor?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			select: {
				value?: string | number
				onChange?: (event: Event) => void
				disabled?: boolean
				multiple?: boolean
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			option: {
				value?: string | number
				disabled?: boolean
				selected?: boolean
				[key: string]: any
			}
			textarea: {
				value?: string
				placeholder?: string
				rows?: number
				cols?: number
				onChange?: (event: Event) => void
				onInput?: (event: Event) => void
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
			// 允许其他 HTML 元素，但使用更严格的类型
			[elem: string]: {
				id?: string
				className?: string
				style?: string | { [key: string]: string | number }
				[key: string]: any
			}
		}
	}
}

export {}
