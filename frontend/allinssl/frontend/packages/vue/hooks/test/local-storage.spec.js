import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import useLocalStorage from '../src/local-storage'
describe('useLocalStorage', () => {
	// 保存原始的localStorage
	const originalLocalStorage = window.localStorage
	beforeEach(() => {
		// 创建模拟的localStorage
		const localStorageMock = {
			store: {},
			getItem: vi.fn((key) => localStorageMock.store[key] || null),
			setItem: vi.fn((key, value) => {
				localStorageMock.store[key] = value
			}),
			removeItem: vi.fn((key) => {
				delete localStorageMock.store[key]
			}),
			clear: vi.fn(() => {
				localStorageMock.store = {}
			}),
			key: vi.fn((index) => Object.keys(localStorageMock.store)[index] || null),
			length: 0,
		}
		// 替换全局的localStorage
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
			writable: true,
		})
		// 监视console.error
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})
	afterEach(() => {
		// 恢复原始的localStorage
		Object.defineProperty(window, 'localStorage', {
			value: originalLocalStorage,
			writable: true,
		})
		vi.restoreAllMocks()
	})
	it('应该使用localStorage存储数据', async () => {
		const value = useLocalStorage('testKey', { name: 'test' })
		// 验证初始值已存储到localStorage
		expect(window.localStorage.setItem).toHaveBeenCalled()
		// 修改值
		value.value = { name: 'updated' }
		await nextTick()
		// 验证更新的值已存储到localStorage
		const lastCall = window.localStorage.setItem.mock.calls.pop()
		expect(lastCall[0]).toBe('testKey')
		expect(JSON.parse(lastCall[1]).value).toEqual({ name: 'updated' })
	})
	it('应该从localStorage加载存储的数据', () => {
		// 预先设置localStorage的值
		const storedValue = { value: { name: 'stored' } }
		window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(storedValue))
		const value = useLocalStorage('testKey', { name: 'default' })
		// 验证加载了存储的值而不是默认值
		expect(value.value).toEqual({ name: 'stored' })
		expect(window.localStorage.getItem).toHaveBeenCalledWith('testKey')
	})
	it('当设置为null时应该从localStorage移除数据', async () => {
		const value = useLocalStorage('testKey', { name: 'test' })
		// 设置为null
		value.value = null
		await nextTick()
		// 验证数据已从localStorage中移除
		expect(window.localStorage.removeItem).toHaveBeenCalledWith('testKey')
	})
	it('应该支持过期时间选项', () => {
		vi.useFakeTimers()
		const now = Date.now()
		vi.setSystemTime(now)
		useLocalStorage('testKey', 'test', { expires: 1000 })
		// 验证设置了过期时间
		const lastCall = window.localStorage.setItem.mock.calls.pop()
		const storedData = JSON.parse(lastCall[1])
		expect(storedData.expires).toBe(now + 1000)
		vi.useRealTimers()
	})
})
//# sourceMappingURL=local-storage.spec.js.map
