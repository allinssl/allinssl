import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useDebounceFn from '../src/debounce-fn'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
describe('useDebounceFn', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.restoreAllMocks()
		vi.useRealTimers()
	})
	it('应该在指定延迟后执行函数', async () => {
		const mockFn = vi.fn().mockReturnValue('测试结果')
		const debounced = useDebounceFn(mockFn, 100)
		const promise = debounced('参数1', '参数2')
		expect(mockFn).not.toHaveBeenCalled()
		// 前进100ms
		vi.advanceTimersByTime(100)
		const result = await promise
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenCalledWith('参数1', '参数2')
		expect(result).toBe('测试结果')
	})
	it('应该在多次调用时只执行最后一次', async () => {
		const mockFn = vi.fn()
		const debounced = useDebounceFn(mockFn, 100)
		debounced('调用1')
		debounced('调用2')
		debounced('调用3')
		expect(mockFn).not.toHaveBeenCalled()
		// 前进100ms
		vi.advanceTimersByTime(100)
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenCalledWith('调用3')
	})
	it('应该支持函数形式的延迟参数', async () => {
		const mockFn = vi.fn()
		const getDelay = () => 200
		const debounced = useDebounceFn(mockFn, getDelay)
		debounced()
		expect(mockFn).not.toHaveBeenCalled()
		// 前进100ms
		vi.advanceTimersByTime(100)
		expect(mockFn).not.toHaveBeenCalled()
		// 再前进100ms
		vi.advanceTimersByTime(100)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('应该支持executeDelay选项', async () => {
		const mockFn = vi.fn()
		const debounced = useDebounceFn(mockFn, 100, { executeDelay: 50 })
		debounced()
		expect(mockFn).not.toHaveBeenCalled()
		// 前进100ms - 防抖结束但还没执行
		vi.advanceTimersByTime(100)
		expect(mockFn).not.toHaveBeenCalled()
		// 再前进50ms - executeDelay后应该执行
		vi.advanceTimersByTime(50)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('如果在等待期间再次调用应该重置定时器', async () => {
		const mockFn = vi.fn()
		const debounced = useDebounceFn(mockFn, 100)
		debounced()
		// 前进50ms
		vi.advanceTimersByTime(50)
		expect(mockFn).not.toHaveBeenCalled()
		// 再次调用
		debounced()
		// 再前进50ms - 原来的定时器时间到了，但由于重置应该还没执行
		vi.advanceTimersByTime(50)
		expect(mockFn).not.toHaveBeenCalled()
		// 再前进50ms - 新定时器时间到了，应该执行
		vi.advanceTimersByTime(50)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('应该支持立即执行选项', async () => {
		const mockFn = vi.fn()
		const debounced = useDebounceFn(mockFn, 100, { immediate: true })
		// 第一次调用立即执行
		debounced('立即参数')
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenCalledWith('立即参数')
		// 延迟期间再次调用不会立即执行
		debounced('第二次参数')
		expect(mockFn).toHaveBeenCalledTimes(1)
		// 前进100ms后，应该执行最后一次调用
		vi.advanceTimersByTime(100)
		expect(mockFn).toHaveBeenCalledTimes(2)
		expect(mockFn).toHaveBeenLastCalledWith('第二次参数')
	})
	it('应该支持防抖函数的取消功能', async () => {
		const mockFn = vi.fn()
		const { run, cancel } = useDebounceFn(mockFn, 100)
		run()
		expect(mockFn).not.toHaveBeenCalled()
		// 取消防抖
		cancel()
		// 前进100ms
		vi.advanceTimersByTime(100)
		expect(mockFn).not.toHaveBeenCalled()
	})
	it('应该支持防抖函数的立即执行功能', async () => {
		const mockFn = vi.fn()
		const { run, flush } = useDebounceFn(mockFn, 100)
		run('待执行参数')
		expect(mockFn).not.toHaveBeenCalled()
		// 立即执行
		flush()
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenCalledWith('待执行参数')
		// 前进100ms, 由于已经执行过，不会再次执行
		vi.advanceTimersByTime(100)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('在组件卸载时应该清除定时器', () => {
		const mockFn = vi.fn()
		// 模拟组件中使用hook
		const wrapper = mount({
			template: '<div></div>',
			setup() {
				const debounced = useDebounceFn(mockFn, 100)
				debounced()
				return { debounced }
			},
		})
		expect(mockFn).not.toHaveBeenCalled()
		// 卸载组件，此时应该清除定时器
		wrapper.unmount()
		// 前进100ms，由于组件已卸载，定时器应该被清除
		vi.advanceTimersByTime(100)
		expect(mockFn).not.toHaveBeenCalled()
	})
	it('应该保留函数的上下文', async () => {
		const context = {
			value: '上下文值',
			fn() {
				return this.value
			},
		}
		const spy = vi.spyOn(context, 'fn')
		const debounced = useDebounceFn(context.fn.bind(context), 100)
		debounced()
		vi.advanceTimersByTime(100)
		expect(spy).toHaveBeenCalledTimes(1)
		expect(spy.mock.results[0].value).toBe('上下文值')
	})
	it('应该支持动态修改延迟时间', async () => {
		const mockFn = vi.fn()
		const delay = ref(100)
		const debounced = useDebounceFn(mockFn, delay)
		debounced()
		expect(mockFn).not.toHaveBeenCalled()
		// 修改延迟为50ms
		delay.value = 50
		await nextTick()
		// 前进50ms
		vi.advanceTimersByTime(50)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('应该支持Promise返回值', async () => {
		const mockFn = vi.fn().mockResolvedValue('Promise结果')
		const debounced = useDebounceFn(mockFn, 100)
		const promise = debounced()
		vi.advanceTimersByTime(100)
		const result = await promise
		expect(result).toBe('Promise结果')
	})
	it('应该处理函数执行期间的错误', async () => {
		const error = new Error('测试错误')
		const mockFn = vi.fn().mockRejectedValue(error)
		const debounced = useDebounceFn(mockFn, 100)
		const promise = debounced()
		vi.advanceTimersByTime(100)
		await expect(promise).rejects.toThrow('测试错误')
	})
	it('在多次调用时应该只保留最后一个Promise', async () => {
		let callIndex = 0
		const mockFn = vi.fn().mockImplementation(() => {
			callIndex++
			return Promise.resolve(`结果${callIndex}`)
		})
		const debounced = useDebounceFn(mockFn, 100)
		const promise1 = debounced()
		const promise2 = debounced()
		const promise3 = debounced()
		vi.advanceTimersByTime(100)
		// 所有promise应该解析为最后一次调用的结果
		expect(await promise1).toBe('结果1')
		expect(await promise2).toBe('结果1')
		expect(await promise3).toBe('结果1')
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('应该支持maxWait选项，确保函数在指定时间内至少执行一次', async () => {
		const mockFn = vi.fn()
		const debounced = useDebounceFn(mockFn, 100, { maxWait: 300 })
		debounced()
		// 前进50ms
		vi.advanceTimersByTime(50)
		// 再次调用重置防抖
		debounced()
		// 再前进50ms
		vi.advanceTimersByTime(50)
		// 再次调用重置防抖
		debounced()
		// 再前进50ms
		vi.advanceTimersByTime(50)
		// 再次调用重置防抖
		debounced()
		// 再前进50ms
		vi.advanceTimersByTime(50)
		// 再次调用重置防抖
		debounced()
		// 再前进100ms，此时总共过去了300ms，应该由于maxWait触发函数执行
		vi.advanceTimersByTime(100)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('应该支持组合使用immediate和trailing选项', async () => {
		const mockFn = vi.fn()
		const debounced = useDebounceFn(mockFn, 100, {
			immediate: true,
			trailing: false,
		})
		// 第一次调用立即执行
		debounced('第一次')
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(mockFn).toHaveBeenCalledWith('第一次')
		// 延迟期间再次调用
		debounced('第二次')
		// 前进100ms
		vi.advanceTimersByTime(100)
		// 由于trailing为false，不会执行最后一次调用
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
})
//# sourceMappingURL=debounce-fn.spec.js.map
