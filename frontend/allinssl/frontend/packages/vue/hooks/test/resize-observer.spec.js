import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import useResizeObserver from '../src/resize-observer'
import { mount } from '@vue/test-utils'
describe('useResizeObserver', () => {
	// 保存原始的ResizeObserver
	const originalResizeObserver = global.ResizeObserver
	// 模拟ResizeObserver
	class MockResizeObserver {
		callback
		observedElements
		constructor(callback) {
			this.callback = callback
			this.observedElements = new Set()
		}
		observe = vi.fn((el) => {
			this.observedElements.add(el)
			// 模拟元素大小变化
			setTimeout(() => {
				this.callback([
					{
						target: el,
						contentRect: { width: 100, height: 100 },
					},
				])
			}, 0)
		})
		unobserve = vi.fn((el) => {
			this.observedElements.delete(el)
		})
		disconnect = vi.fn(() => {
			this.observedElements.clear()
		})
		// 模拟大小变化
		simulateResize(el, width, height) {
			if (this.observedElements.has(el)) {
				this.callback([
					{
						target: el,
						contentRect: { width, height },
					},
				])
			}
		}
	}
	// 全局mock对象
	let mockObserver
	beforeEach(() => {
		// 安装模拟的ResizeObserver
		global.ResizeObserver = vi.fn((callback) => {
			mockObserver = new MockResizeObserver(callback)
			return mockObserver
		})
		// 监视console.warn
		vi.spyOn(console, 'warn').mockImplementation(() => {})
	})
	afterEach(() => {
		// 恢复原始的ResizeObserver
		global.ResizeObserver = originalResizeObserver
		vi.restoreAllMocks()
	})
	it('应该返回元素的宽高', async () => {
		const div = document.createElement('div')
		const { width, height } = useResizeObserver(div)
		await nextTick()
		expect(width.value).toBe(100)
		expect(height.value).toBe(100)
	})
	it('应该支持使用Ref包装的元素', async () => {
		const div = document.createElement('div')
		const elementRef = ref(div)
		const { width, height } = useResizeObserver(elementRef)
		await nextTick()
		expect(width.value).toBe(100)
		expect(height.value).toBe(100)
		// 改变引用
		const newDiv = document.createElement('div')
		elementRef.value = newDiv
		await nextTick()
		// 验证新元素被监听，旧元素被取消监听
		expect(mockObserver.observe).toHaveBeenCalledWith(newDiv)
		expect(mockObserver.unobserve).toHaveBeenCalledWith(div)
	})
	it('应该在元素变化时调用回调函数', async () => {
		const div = document.createElement('div')
		const callback = vi.fn()
		useResizeObserver(div, callback)
		await nextTick()
		// 验证回调被调用
		expect(callback).toHaveBeenCalledTimes(1)
		expect(callback).toHaveBeenCalledWith(
			expect.objectContaining({
				target: div,
				contentRect: { width: 100, height: 100 },
			}),
		)
		// 模拟元素大小变化
		mockObserver.simulateResize(div, 200, 150)
		// 验证回调再次被调用，且参数正确
		expect(callback).toHaveBeenCalledTimes(2)
		expect(callback).toHaveBeenCalledWith(
			expect.objectContaining({
				target: div,
				contentRect: { width: 200, height: 150 },
			}),
		)
	})
	it('应该在组件卸载时断开观察', async () => {
		// 挂载组件
		const wrapper = mount({
			template: '<div></div>',
			setup() {
				const el = ref(null)
				return {
					el,
					...useResizeObserver(el),
				}
			},
		})
		await nextTick()
		// 卸载组件
		wrapper.unmount()
		// 验证断开连接
		expect(mockObserver.disconnect).toHaveBeenCalled()
	})
	it('在ResizeObserver不存在时应该使用fallback', async () => {
		// 临时删除ResizeObserver
		global.ResizeObserver = undefined
		const div = document.createElement('div')
		// 模拟元素的getBoundingClientRect方法
		div.getBoundingClientRect = vi.fn().mockReturnValue({
			width: 200,
			height: 150,
		})
		const { width, height } = useResizeObserver(div)
		await nextTick()
		// 验证fallback获取了正确的尺寸
		expect(width.value).toBe(200)
		expect(height.value).toBe(150)
		// 验证警告信息
		expect(console.warn).toHaveBeenCalledWith('ResizeObserver is not supported, using window resize fallback.')
		// 触发window resize事件
		div.getBoundingClientRect = vi.fn().mockReturnValue({
			width: 300,
			height: 250,
		})
		window.dispatchEvent(new Event('resize'))
		await nextTick()
		// 验证尺寸更新
		expect(width.value).toBe(300)
		expect(height.value).toBe(250)
	})
	it('fallback应该在元素引用变化时更新尺寸', async () => {
		// 临时删除ResizeObserver
		global.ResizeObserver = undefined
		const div = document.createElement('div')
		div.getBoundingClientRect = vi.fn().mockReturnValue({
			width: 200,
			height: 150,
		})
		const elementRef = ref(div)
		const { width, height } = useResizeObserver(elementRef)
		await nextTick()
		expect(width.value).toBe(200)
		expect(height.value).toBe(150)
		// 改变引用
		const newDiv = document.createElement('div')
		newDiv.getBoundingClientRect = vi.fn().mockReturnValue({
			width: 400,
			height: 300,
		})
		elementRef.value = newDiv
		await nextTick()
		// 验证尺寸更新
		expect(width.value).toBe(400)
		expect(height.value).toBe(300)
	})
	it('当Ref元素为null时应该正确处理', async () => {
		const elementRef = ref(null)
		const { width, height } = useResizeObserver(elementRef)
		// 初始值应为0
		expect(width.value).toBe(0)
		expect(height.value).toBe(0)
		// 设置有效元素
		const div = document.createElement('div')
		elementRef.value = div
		await nextTick()
		// 验证元素被观察
		expect(mockObserver.observe).toHaveBeenCalledWith(div)
		// 再次设为null
		elementRef.value = null
		await nextTick()
		// 验证元素被取消观察
		expect(mockObserver.unobserve).toHaveBeenCalledWith(div)
	})
	it('当多个尺寸变化同时发生时应正确处理', async () => {
		const div1 = document.createElement('div')
		const div2 = document.createElement('div')
		const { width: width1, height: height1 } = useResizeObserver(div1)
		const { width: width2, height: height2 } = useResizeObserver(div2)
		await nextTick()
		// 模拟多个元素同时变化
		mockObserver.simulateResize(div1, 150, 120)
		mockObserver.simulateResize(div2, 250, 220)
		// 验证每个元素的尺寸正确更新
		expect(width1.value).toBe(150)
		expect(height1.value).toBe(120)
		expect(width2.value).toBe(250)
		expect(height2.value).toBe(220)
	})
})
//# sourceMappingURL=resize-observer.spec.js.map
