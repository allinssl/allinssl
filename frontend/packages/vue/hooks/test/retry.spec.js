import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useRetry from '../src/retry'
describe('useRetry', () => {
	beforeEach(() => {
		vi.useFakeTimers() // 使用假定时器
	})
	afterEach(() => {
		vi.clearAllTimers() // 清除所有定时器
		vi.useRealTimers() // 恢复真实定时器
	})
	it('should execute successfully on first try', async () => {
		const mockFn = vi.fn().mockResolvedValue('success') // 模拟成功
		const { run, loading, error } = useRetry(mockFn)
		const promise = run()
		expect(loading.value).toBe(true)
		expect(error.value).toBe(null)
		const result = await promise
		expect(result).toBe('success')
		expect(loading.value).toBe(false)
		expect(error.value).toBe(null)
		expect(mockFn).toHaveBeenCalledTimes(1)
	})
	it('should retry on failure and succeed eventually', async () => {
		const mockError = new Error('test error')
		const mockFn = vi
			.fn()
			.mockRejectedValueOnce(mockError)
			.mockRejectedValueOnce(mockError)
			.mockResolvedValue('success')
		const { run, loading, error } = useRetry(mockFn, {
			retries: 3,
			delay: 1000,
		})
		const promise = run()
		expect(loading.value).toBe(true)
		expect(error.value).toBe(null)
		// First failure
		await vi.advanceTimersByTime(0)
		expect(error.value).toBe(mockError)
		expect(loading.value).toBe(true)
		// Second failure
		await vi.advanceTimersByTime(1000)
		expect(error.value).toBe(mockError)
		expect(loading.value).toBe(true)
		// Success on third try
		await vi.advanceTimersByTime(1000)
		const result = await promise
		expect(result).toBe('success')
		expect(loading.value).toBe(false)
		expect(error.value).toBe(null)
		expect(mockFn).toHaveBeenCalledTimes(3)
	})
	it('should throw after max retries', async () => {
		const mockError = new Error('persistent error')
		const mockFn = vi.fn().mockRejectedValue(mockError)
		const { run, loading, error } = useRetry(mockFn, {
			retries: 2,
			delay: 500,
		})
		const promise = run()
		expect(loading.value).toBe(true)
		expect(error.value).toBe(null)
		// First attempt
		await vi.advanceTimersByTime(0)
		expect(error.value).toBe(mockError)
		expect(loading.value).toBe(true)
		// First retry
		await vi.advanceTimersByTime(500)
		expect(error.value).toBe(mockError)
		expect(loading.value).toBe(true)
		// Second retry
		await vi.advanceTimersByTime(500)
		await expect(promise).rejects.toThrow(mockError)
		expect(loading.value).toBe(false)
		expect(error.value).toBe(mockError)
		expect(mockFn).toHaveBeenCalledTimes(3)
	})
	it('should use default options when not provided', async () => {
		const mockError = new Error('temporary error')
		const mockFn = vi
			.fn()
			.mockRejectedValueOnce(mockError)
			.mockRejectedValueOnce(mockError)
			.mockRejectedValueOnce(mockError)
			.mockResolvedValue('success')
		const { run, loading, error } = useRetry(mockFn)
		const promise = run()
		expect(loading.value).toBe(true)
		// First attempt
		await vi.advanceTimersByTime(0)
		expect(error.value).toBe(mockError)
		// First retry
		await vi.advanceTimersByTime(1000)
		expect(error.value).toBe(mockError)
		// Second retry
		await vi.advanceTimersByTime(1000)
		expect(error.value).toBe(mockError)
		// Third retry
		await vi.advanceTimersByTime(1000)
		const result = await promise
		expect(result).toBe('success')
		expect(loading.value).toBe(false)
		expect(error.value).toBe(null)
		expect(mockFn).toHaveBeenCalledTimes(4)
	})
	it('should reset error state on each run', async () => {
		const mockError = new Error('first run error')
		const mockFn = vi.fn().mockRejectedValueOnce(mockError).mockResolvedValueOnce('second run success')
		const { run, error } = useRetry(mockFn, { retries: 0 })
		// First run fails
		await expect(run()).rejects.toThrow(mockError)
		expect(error.value).toBe(mockError)
		// Second run succeeds
		const result = await run()
		expect(result).toBe('second run success')
		expect(error.value).toBe(null)
	})
	it('should prevent concurrent executions', async () => {
		const mockFn = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000))
			return 'success'
		})
		const { run, loading } = useRetry(mockFn)
		// First execution
		const promise1 = run()
		expect(loading.value).toBe(true)
		// Second execution during first one
		const promise2 = run()
		// Should reuse the first execution
		expect(mockFn).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTime(1000)
		const [result1, result2] = await Promise.all([promise1, promise2])
		expect(result1).toBe('success')
		expect(result2).toBe('success')
		expect(mockFn).toHaveBeenCalledTimes(1)
		expect(loading.value).toBe(false)
	})
})
//# sourceMappingURL=retry.spec.js.map
