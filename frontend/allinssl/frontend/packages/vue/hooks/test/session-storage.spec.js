import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import useSessionStorage from '../src/session-storage'
describe('useSessionStorage', () => {
	// 保存原始的sessionStorage
	const originalSessionStorage = window.sessionStorage
	let sessionStorageMockEvents = []
	beforeEach(() => {
		// 重置事件数组
		sessionStorageMockEvents = []
		// 创建模拟的sessionStorage
		const sessionStorageMock = {
			store: {},
			getItem: vi.fn((key) => sessionStorageMock.store[key] || null),
			setItem: vi.fn((key, value) => {
				const oldValue = sessionStorageMock.store[key]
				sessionStorageMock.store[key] = value
				// 触发storage事件
				const event = new CustomEvent('storage', {
					detail: {
						key,
						oldValue,
						newValue: value,
						storageArea: sessionStorageMock,
						url: window.location.href,
					},
				})
				sessionStorageMockEvents.push(event)
				window.dispatchEvent(event)
			}),
			removeItem: vi.fn((key) => {
				const oldValue = sessionStorageMock.store[key]
				delete sessionStorageMock.store[key]
				// 触发storage事件
				const event = new CustomEvent('storage', {
					detail: {
						key,
						oldValue,
						newValue: null,
						storageArea: sessionStorageMock,
						url: window.location.href,
					},
				})
				sessionStorageMockEvents.push(event)
				window.dispatchEvent(event)
			}),
			clear: vi.fn(() => {
				sessionStorageMock.store = {}
				// 触发storage事件
				const event = new CustomEvent('storage', {
					detail: {
						key: null,
						oldValue: null,
						newValue: null,
						storageArea: sessionStorageMock,
						url: window.location.href,
					},
				})
				sessionStorageMockEvents.push(event)
				window.dispatchEvent(event)
			}),
			key: vi.fn((index) => Object.keys(sessionStorageMock.store)[index] || null),
			get length() {
				return Object.keys(sessionStorageMock.store).length
			},
		}
		// 替换全局的sessionStorage
		Object.defineProperty(window, 'sessionStorage', {
			value: sessionStorageMock,
			writable: true,
		})
		// 监视console.error
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		// 添加事件监听器模拟
		vi.spyOn(window, 'addEventListener')
		vi.spyOn(window, 'removeEventListener')
	})
	afterEach(() => {
		// 恢复原始的sessionStorage
		Object.defineProperty(window, 'sessionStorage', {
			value: originalSessionStorage,
			writable: true,
		})
		vi.restoreAllMocks()
	})
	it('应该使用sessionStorage存储数据', async () => {
		const value = useSessionStorage('testKey', { name: 'test' })
		// 验证初始值已存储到sessionStorage
		expect(window.sessionStorage.setItem).toHaveBeenCalled()
		// 修改值
		value.value = { name: 'updated' }
		await nextTick()
		// 验证更新的值已存储到sessionStorage
		const lastCall = window.sessionStorage.setItem.mock.calls.pop()
		expect(lastCall[0]).toBe('testKey')
		expect(JSON.parse(lastCall[1]).value).toEqual({ name: 'updated' })
	})
	it('应该从sessionStorage加载存储的数据', () => {
		// 预先设置sessionStorage的值
		const storedValue = { value: { name: 'stored' } }
		window.sessionStorage.getItem.mockReturnValueOnce(JSON.stringify(storedValue))
		const value = useSessionStorage('testKey', { name: 'default' })
		// 验证加载了存储的值而不是默认值
		expect(value.value).toEqual({ name: 'stored' })
		expect(window.sessionStorage.getItem).toHaveBeenCalledWith('testKey')
	})
	it('当设置为null时应该从sessionStorage移除数据', async () => {
		const value = useSessionStorage('testKey', { name: 'test' })
		// 设置为null
		value.value = null
		await nextTick()
		// 验证数据已从sessionStorage中移除
		expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('testKey')
	})
	it('应该支持过期时间选项', () => {
		vi.useFakeTimers()
		const now = Date.now()
		vi.setSystemTime(now)
		useSessionStorage('testKey', 'test', { expires: 1000 })
		// 验证设置了过期时间
		const lastCall = window.sessionStorage.setItem.mock.calls.pop()
		const storedData = JSON.parse(lastCall[1])
		expect(storedData.expires).toBe(now + 1000)
		vi.useRealTimers()
	})
	it('应该和localStorage使用不同的存储空间', async () => {
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
		// 在sessionStorage中保存数据
		const sessionValue = useSessionStorage('sameKey', 'sessionValue')
		// 确认数据保存在sessionStorage而不是localStorage
		expect(window.sessionStorage.setItem).toHaveBeenCalled()
		expect(window.localStorage.setItem).not.toHaveBeenCalled()
		// 修改sessionStorage中的值
		sessionValue.value = 'updatedSessionValue'
		await nextTick()
		// 验证值被更新到了sessionStorage而不是localStorage
		expect(window.sessionStorage.setItem).toHaveBeenCalledTimes(2)
		expect(window.localStorage.setItem).not.toHaveBeenCalled()
	})
	it('应该处理存储的数据格式不正确的情况', () => {
		// 模拟sessionStorage中存在无效的JSON数据
		window.sessionStorage.getItem.mockReturnValueOnce('invalid json')
		// 使用带有默认值的hook
		const value = useSessionStorage('testKey', 'default')
		// 验证使用了默认值
		expect(value.value).toBe('default')
		// 验证错误被记录
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error parsing'), expect.any(Error))
	})
	it('应该在sessionStorage不可用时使用内存存储', () => {
		// 模拟sessionStorage不可用的情况
		window.sessionStorage.setItem.mockImplementationOnce(() => {
			throw new Error('QuotaExceededError')
		})
		const value = useSessionStorage('testKey', 'default')
		// 验证值仍然可用
		expect(value.value).toBe('default')
		// 修改值
		value.value = 'updated'
		// 验证值被更新（内存中），即使无法保存到sessionStorage
		expect(value.value).toBe('updated')
		// 验证警告被记录
		expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('sessionStorage error'), expect.any(Error))
	})
	it('应该在达到过期时间时使用默认值', () => {
		vi.useFakeTimers()
		const now = Date.now()
		vi.setSystemTime(now)
		// 模拟在sessionStorage中有一个过期的值
		const expiredData = {
			value: 'expired',
			expires: now - 1000, // 已过期1秒
		}
		window.sessionStorage.getItem.mockReturnValueOnce(JSON.stringify(expiredData))
		// 使用hook
		const value = useSessionStorage('testKey', 'default')
		// 验证使用了默认值而不是过期的值
		expect(value.value).toBe('default')
		vi.useRealTimers()
	})
	it('应该监听storage事件同步其他标签页的变化', async () => {
		// 创建两个使用相同键的hooks实例
		const value1 = useSessionStorage('syncKey', 'initial')
		const value2 = useSessionStorage('syncKey', 'other')
		// 验证它们有相同的初始值
		expect(value1.value).toBe('initial')
		expect(value2.value).toBe('initial')
		// 修改第一个实例的值
		value1.value = 'updated'
		await nextTick()
		// 验证第二个实例的值也更新了
		expect(value2.value).toBe('updated')
		// 模拟从另一个标签页修改同一个键
		const event = new StorageEvent('storage', {
			key: 'syncKey',
			newValue: JSON.stringify({ value: 'from another tab' }),
			storageArea: window.sessionStorage,
		})
		window.dispatchEvent(event)
		await nextTick()
		// 验证两个实例都更新了值
		expect(value1.value).toBe('from another tab')
		expect(value2.value).toBe('from another tab')
	})
	it('应该支持自定义序列化和反序列化', () => {
		// 创建自定义的序列化和反序列化函数
		const serializer = {
			serialize: vi.fn((value) => `custom:${JSON.stringify(value)}`),
			deserialize: vi.fn((value) => {
				if (value && value.startsWith('custom:')) {
					return JSON.parse(value.slice(7))
				}
				return null
			}),
		}
		// 使用自定义序列化器
		const value = useSessionStorage(
			'customKey',
			{ test: true },
			{
				serializer,
			},
		)
		// 验证自定义序列化器被使用
		expect(serializer.serialize).toHaveBeenCalled()
		// 检查存储的数据格式
		const lastCall = window.sessionStorage.setItem.mock.calls.pop()
		expect(lastCall[1]).toContain('custom:')
		// 模拟从存储加载数据
		window.sessionStorage.getItem.mockReturnValueOnce('custom:{"result":"loaded"}')
		// 创建一个新的hook实例使用相同的键和序列化器
		const loadedValue = useSessionStorage('customKey', null, { serializer })
		// 验证反序列化器被使用
		expect(serializer.deserialize).toHaveBeenCalled()
		expect(loadedValue.value).toEqual({ result: 'loaded' })
	})
	it('应该支持使用ref作为默认值', async () => {
		const defaultValueRef = ref('initialRef')
		// 使用ref作为默认值
		const value = useSessionStorage('refKey', defaultValueRef)
		// 验证初始值
		expect(value.value).toBe('initialRef')
		// 修改ref的值
		defaultValueRef.value = 'updatedRef'
		await nextTick()
		// 验证存储的值没有变化，只是默认值变化了
		expect(value.value).toBe('initialRef') // 已经初始化的值不会随着默认值ref变化
		// 创建一个新的带有相同键的实例但没有初始值
		window.sessionStorage.getItem.mockReturnValueOnce(null)
		const newValue = useSessionStorage('newRefKey', defaultValueRef)
		// 验证新实例使用了当前的ref值
		expect(newValue.value).toBe('updatedRef')
	})
	it('应该在组件卸载时取消事件监听', () => {
		// 使用onUnmounted来模拟组件卸载
		const unmountHandlers = []
		vi.mock('vue', async () => {
			const actual = await vi.importActual('vue')
			return {
				...actual,
				onUnmounted: (fn) => unmountHandlers.push(fn),
			}
		})
		// 创建hook实例
		useSessionStorage('testKey', 'value')
		// 验证添加了事件监听器
		expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
		// 模拟组件卸载
		unmountHandlers.forEach((handler) => handler())
		// 验证移除了事件监听器
		expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
	})
})
//# sourceMappingURL=session-storage.spec.js.map
