import { App, Directive } from 'vue'

/**
 * 移除输入框中的空格
 * 用法：v-nospace
 */
export const vNospace: Directive = {
	mounted(el: HTMLElement) {
		el.addEventListener('input', (event: Event) => {
			const inputElement = event.target as HTMLInputElement
			const newValue = inputElement.value.replace(/\s+/g, '')

			// 直接设置输入元素的值
			if (inputElement.value !== newValue) {
				inputElement.value = newValue
				// 触发自定义事件，通知父组件值已更改
				el.dispatchEvent(new Event('input', { bubbles: true }))
			}
		})
	},
}

// 导出所有指令的集合，方便批量注册
export const directives = {
	nospace: vNospace,
}

// 注册所有指令
export const useDirectives = (app: App, directives: Record<string, Directive>) => {
	Object.entries(directives).forEach(([key, value]) => {
		app.directive(key, value)
	})
}
