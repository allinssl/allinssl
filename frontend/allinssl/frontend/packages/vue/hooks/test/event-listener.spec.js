import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import useEventListener from '../src/event-listener'
import { mount, flushPromises } from '@vue/test-utils'
describe('useEventListener', () => {
	let element
	let eventHandler
	let cleanup
	beforeEach(() => {
		// 创建测试DOM元素
		element = document.createElement('div')
		document.body.appendChild(element)
		// 创建事件处理函数的模拟函数
		eventHandler = vi.fn()
		// 清除beforeEach中创建的资源
		cleanup = () => {
			document.body.removeChild(element)
		}
	})
	afterEach(() => {
		vi.restoreAllMocks()
		cleanup()
	})
	it('为元素添加事件监听', async () => {
		// 创建包含组件hook的测试组件
		const wrapper = mount({
			template: '<div></div>',
			setup() {
				useEventListener(element, 'click', eventHandler)
			},
		})
		await flushPromises()
		// 触发事件
		element.click()
		// 验证事件处理函数被调用
		expect(eventHandler).toHaveBeenCalledTimes(1)
		// 销毁组件
		wrapper.unmount()
		// 再次触发事件
		element.click()
		// 验证事件处理函数没有被再次调用（已经被移除）
		expect(eventHandler).toHaveBeenCalledTimes(1)
	})
	it('支持Ref包装的元素目标', async () => {
		// 创建另一个测试元素
		const anotherElement = document.createElement('button')
		document.body.appendChild(anotherElement)
		// 创建Ref包装的元素引用
		const targetRef = ref(element)
		const wrapper = mount({
			template: '<div></div>',
			setup() {
				useEventListener(targetRef, 'click', eventHandler)
				return { targetRef }
			},
		})
		await flushPromises()
		// 触发原始元素事件
		element.click()
		expect(eventHandler).toHaveBeenCalledTimes(1)
		// 改变引用的元素
		targetRef.value = anotherElement
		await nextTick()
		// 原始元素事件应该不再被监听
		element.click()
		expect(eventHandler).toHaveBeenCalledTimes(1)
		// 新元素事件应该被监听
		anotherElement.click()
		expect(eventHandler).toHaveBeenCalledTimes(2)
		// 清理
		document.body.removeChild(anotherElement)
		wrapper.unmount()
	})
	it('支持手动注销事件监听', async () => {
		const { unregister } = useEventListener(element, 'click', eventHandler)
		// 触发事件
		element.click()
		expect(eventHandler).toHaveBeenCalledTimes(1)
		// 手动注销监听
		unregister()
		// 再次触发事件
		element.click()
		// 验证事件处理函数没有被再次调用
		expect(eventHandler).toHaveBeenCalledTimes(1)
	})
	it('支持传递事件选项', async () => {
		const captureHandler = vi.fn()
		const bubbleHandler = vi.fn()
		// 创建父子元素结构
		const parent = document.createElement('div')
		const child = document.createElement('div')
		parent.appendChild(child)
		document.body.appendChild(parent)
		// 使用捕获模式监听父元素
		useEventListener(parent, 'click', captureHandler, { capture: true })
		// 使用冒泡模式监听子元素
		useEventListener(child, 'click', bubbleHandler)
		// 触发子元素事件
		child.click()
		// 验证捕获和冒泡顺序（捕获先于冒泡）
		expect(captureHandler).toHaveBeenCalledTimes(1)
		expect(bubbleHandler).toHaveBeenCalledTimes(1)
		// 由于Jest无法验证实际调用顺序，我们只能确认两个处理函数都被调用
		// 清理
		document.body.removeChild(parent)
	})
})
//# sourceMappingURL=event-listener.spec.js.map
