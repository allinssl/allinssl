import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import useStorage from '../src/storage'
// 创建模拟的 Storage
class MockStorage {
	store = {}
	length = 0
	clear() {
		this.store = {}
		this.length = 0
	}
	getItem(key) {
		return this.store[key] || null
	}
	key(index) {
		return Object.keys(this.store)[index] || null
	}
	removeItem(key) {
		delete this.store[key]
		this.length = Object.keys(this.store).length
	}
	setItem(key, value) {
		this.store[key] = value
		this.length = Object.keys(this.store).length
	}
}
describe('useStorage', () => {
	let storage
	beforeEach(() => {
		storage = new MockStorage()
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})
	afterEach(() => {
		vi.restoreAllMocks()
	})
	it('初始化时返回默认值', () => {
		const initialValue = { name: 'test' }
		const value = useStorage('testKey', initialValue, {}, storage)
		expect(value.value).toEqual(initialValue)
		expect(storage.getItem('testKey')).not.toBeNull()
	})
	it('可以读取已存储的值', () => {
		const storedValue = { name: 'stored' }
		const serialized = JSON.stringify({ value: storedValue })
		storage.setItem('testKey', serialized)
		const value = useStorage('testKey', { name: 'default' }, {}, storage)
		expect(value.value).toEqual(storedValue)
	})
	it('当值发生变化时更新存储', async () => {
		const value = useStorage('testKey', { name: 'test' }, {}, storage)
		value.value = { name: 'updated' }
		await nextTick()
		const stored = JSON.parse(storage.getItem('testKey') || '{}')
		expect(stored.value).toEqual({ name: 'updated' })
	})
	it('当值为null或undefined时从存储中移除', async () => {
		const value = useStorage('testKey', { name: 'test' }, {}, storage)
		value.value = null
		await nextTick()
		expect(storage.getItem('testKey')).toBeNull()
	})
	it('支持配置过期时间', () => {
		vi.useFakeTimers()
		const now = Date.now()
		vi.setSystemTime(now)
		const value = useStorage('testKey', 'test', { expires: 1000 }, storage)
		const stored = JSON.parse(storage.getItem('testKey') || '{}')
		expect(stored.expires).toEqual(now + 1000)
		// 设置时间为刚好过期
		vi.setSystemTime(now + 1001)
		// 读取过期的值应该返回默认值
		const expiredValue = useStorage('testKey', 'default', {}, storage)
		expect(expiredValue.value).toBe('default')
		vi.useRealTimers()
	})
	it('支持自定义合并策略', () => {
		const storedValue = { name: 'stored', age: 20 }
		storage.setItem('testKey', JSON.stringify({ value: storedValue }))
		// 使用自定义合并函数
		const mergeDefaults = (stored, defaults) => ({
			...defaults,
			name: stored.name,
		})
		const value = useStorage('testKey', { name: 'default', role: 'admin' }, { mergeDefaults }, storage)
		expect(value.value).toEqual({ name: 'stored', role: 'admin' })
	})
})
//# sourceMappingURL=storage.spec.js.map
