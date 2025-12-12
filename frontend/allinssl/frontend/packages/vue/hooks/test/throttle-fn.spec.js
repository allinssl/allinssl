import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useThrottleFn } from '../src/throttle-fn'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
describe('useThrottleFn', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.restoreAllMocks()
		vi.useRealTimers()
	})
	it('应该立即执行第一次调用', () => {
		const mockFn = vi.fn()
		const throttled = useThrottleFn(mockFn, 100)
		throttled('参数1', '参数2')
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenCalledWith('参数1', '参数2')
	})
	it('在规定延迟内多次调用应该只执行一次', () => {
		const mockFn = vi.fn()
		const throttled = useThrottleFn(mockFn, 100)
		throttled()
		throttled()
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('延迟时间过后应该能再次执行', () => {
		const mockFn = vi.fn()
		const throttled = useThrottleFn(mockFn, 100)
		// 第一次调用立即执行
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 延迟内的调用应该被忽略
		throttled()
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 前进100ms
		vi.advanceTimersByTime(100)
		// 延迟后再次调用应该能执行
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(2)
	})
	it('应该在节流期间保留最后一次调用，并在延迟后执行', () => {
		const mockFn = vi.fn()
		const throttled = useThrottleFn(mockFn, 100)
		// 第一次调用立即执行
		throttled('第一次')
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenLastCalledWith('第一次')
		// 前进50ms，此时仍在节流期间
		vi.advanceTimersByTime(50)
		// 节流期间的调用应该被延迟
		throttled('第二次')
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 前进剩余的50ms
		vi.advanceTimersByTime(50)
		// 延迟后执行最后一次调用
		expect(mockFn).toHaveBeenCalledTimes(2)
		expect(mockFn).toHaveBeenLastCalledWith('第二次')
	})
	it('在组件卸载时应该清除定时器', () => {
		const mockFn = vi.fn()
		// 模拟组件中使用hook
		const wrapper = mount({
			template: '<div></div>',
			setup() {
				const throttled = useThrottleFn(mockFn, 100)
				// 触发第一次调用
				throttled()
				// 50ms后再次调用，此时在节流期间
				setTimeout(() => {
					throttled()
				}, 50)
				return { throttled }
			},
		})
		// 前进50ms，触发第二次调用
		vi.advanceTimersByTime(50)
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 卸载组件，此时应该清除定时器
		wrapper.unmount()
		// 前进剩余的50ms，由于组件已卸载，定时器应该被清除，不会执行第二次调用
		vi.advanceTimersByTime(50)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('应该使用默认延迟时间', () => {
		const mockFn = vi.fn()
		const throttled = useThrottleFn(mockFn) // 使用默认延迟200ms
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 前进100ms，应该还不会再次调用
		vi.advanceTimersByTime(100)
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 再前进100ms，达到默认的200ms
		vi.advanceTimersByTime(100)
		// 此时已经可以再次调用
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(2)
	})
	it('支持leading选项为false，首次调用不立即执行', () => {
		const mockFn = vi.fn()
		const throttled = useThrottleFn(mockFn, 100, { leading: false })
		throttled()
		expect(mockFn).not.toHaveBeenCalled()
		// 前进100ms，首次调用应该被延迟执行
		vi.advanceTimersByTime(100)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('支持trailing选项为false，延迟期间最后一次调用不会被保留执行', () => {
		const mockFn = vi.fn()
		const throttled = useThrottleFn(mockFn, 100, { trailing: false })
		// 第一次调用立即执行
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 前进50ms，此时仍在节流期间
		vi.advanceTimersByTime(50)
		// 节流期间的调用不会被保留
		throttled()
		// 前进剩余的50ms
		vi.advanceTimersByTime(50)
		// 由于trailing为false，最后一次调用不会延迟执行
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('支持在执行期间获取this上下文', () => {
		const obj = {
			value: '测试值',
			method() {
				return this.value
			},
		}
		// 监控method方法
		const spy = vi.spyOn(obj, 'method')
		// 创建节流函数
		const throttled = useThrottleFn(obj.method.bind(obj), 100)
		// 调用并检查返回值
		const result = throttled()
		expect(result).toBe('测试值')
		expect(spy).toHaveBeenCalledTimes(1)
	})
	it('支持取消功能，取消后待执行的调用不会被执行', () => {
		const mockFn = vi.fn()
		const { run, cancel } = useThrottleFn(mockFn, 100)
		// 第一次调用立即执行
		run()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 前进50ms，此时仍在节流期间
		vi.advanceTimersByTime(50)
		// 节流期间的调用应该被延迟
		run()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 取消待执行的调用
		cancel()
		// 前进剩余的50ms
		vi.advanceTimersByTime(50)
		// 由于已取消，最后一次调用不会被执行
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('支持flush功能，立即执行待执行的调用', () => {
		const mockFn = vi.fn()
		const { run, flush } = useThrottleFn(mockFn, 100)
		// 第一次调用立即执行
		run('初始参数')
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenLastCalledWith('初始参数')
		// 前进50ms，此时仍在节流期间
		vi.advanceTimersByTime(50)
		// 节流期间的调用应该被延迟
		run('待执行参数')
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 立即执行待执行的调用
		flush()
		// 待执行的调用应该立即被执行
		expect(mockFn).toHaveBeenCalledTimes(2)
		expect(mockFn).toHaveBeenLastCalledWith('待执行参数')
	})
	it('支持动态修改延迟时间', async () => {
		const mockFn = vi.fn()
		const delay = ref(100)
		// 使用响应式延迟时间
		const throttled = useThrottleFn(mockFn, delay)
		// 第一次调用立即执行
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 修改延迟时间为200ms
		delay.value = 200
		await nextTick()
		// 前进100ms，由于延迟已变为200ms，还不能执行下一次调用
		vi.advanceTimersByTime(100)
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 再前进100ms，总共200ms，此时应该可以执行下一次调用
		vi.advanceTimersByTime(100)
		throttled()
		expect(mockFn).toHaveBeenCalledTimes(2)
	})
	it('支持节流函数返回Promise', async () => {
		const mockFn = vi.fn().mockResolvedValue('结果')
		const throttled = useThrottleFn(mockFn, 100)
		// 调用并等待Promise解析
		const promise = throttled()
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 验证Promise解析结果
		const result = await promise
		expect(result).toBe('结果')
	})
	it('在微任务队列中执行，保持事件顺序', async () => {
		// 记录事件顺序
		const events = []
		const mockFn = vi.fn(() => {
			events.push('函数执行')
		})
		const throttled = useThrottleFn(mockFn, 0)
		events.push('调用前')
		throttled()
		events.push('调用后')
		// 等待微任务队列完成
		await Promise.resolve()
		// 验证事件顺序，即使延迟为0，也应该在当前事件循环结束后执行
		expect(events).toEqual(['调用前', '函数执行', '调用后'])
	})
})
//# sourceMappingURL=throttle-fn.spec.js.map
