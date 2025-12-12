import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useCookie from '../src/cookie'
import { nextTick } from 'vue'
describe('useCookie', () => {
	// 保存原始Document.cookie
	const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
	beforeEach(() => {
		// 模拟cookie存储
		let cookies = ''
		// 重写document.cookie的getter和setter
		Object.defineProperty(document, 'cookie', {
			get: vi.fn(() => cookies),
			set: vi.fn((value) => {
				// 简单的cookie设置模拟
				const [cookieStr] = value.split(';')
				const [key, val] = cookieStr.split('=')
				// 如果值为空字符串，表示删除cookie
				if (!val || val === '') {
					const cookieList = cookies.split('; ')
					cookies = cookieList.filter((cookie) => !cookie.startsWith(`${key}=`)).join('; ')
				} else {
					// 添加或更新cookie
					if (!cookies) {
						cookies = `${cookieStr}`
					} else {
						const cookieList = cookies.split('; ')
						const exists = cookieList.some((cookie) => cookie.startsWith(`${key}=`))
						if (exists) {
							cookies = cookieList.map((cookie) => (cookie.startsWith(`${key}=`) ? cookieStr : cookie)).join('; ')
						} else {
							cookies = cookies ? `${cookies}; ${cookieStr}` : cookieStr
						}
					}
				}
				return true
			}),
			configurable: true,
		})
		// 模拟window.location
		Object.defineProperty(window, 'location', {
			value: { protocol: 'http:' },
			configurable: true,
		})
	})
	afterEach(() => {
		// 恢复原始的document.cookie
		if (originalCookie) {
			Object.defineProperty(Document.prototype, 'cookie', originalCookie)
		}
	})
	it('应该初始化带默认值的Cookie', async () => {
		const { cookie } = useCookie('testCookie', 'defaultValue')
		await nextTick()
		expect(cookie.value).toBe('defaultValue')
		expect(document.cookie).toContain('testCookie=defaultValue')
	})
	it('应该读取现有Cookie', async () => {
		// 预先设置cookie
		document.cookie = 'existingCookie=existingValue'
		const { cookie } = useCookie('existingCookie', 'defaultValue')
		await nextTick()
		expect(cookie.value).toBe('existingValue')
	})
	it('如果无指定键则应该返回所有Cookie', async () => {
		// 预先设置多个cookie
		document.cookie = 'cookie1=value1'
		document.cookie = 'cookie2=value2'
		const { cookies } = useCookie()
		await nextTick()
		expect(cookies.value).toHaveProperty('cookie1', 'value1')
		expect(cookies.value).toHaveProperty('cookie2', 'value2')
	})
	it('应该支持响应式更新Cookie', async () => {
		const { cookie } = useCookie('reactiveCookie', 'initialValue')
		await nextTick()
		expect(document.cookie).toContain('reactiveCookie=initialValue')
		cookie.value = 'updatedValue'
		await nextTick()
		expect(document.cookie).toContain('reactiveCookie=updatedValue')
		expect(document.cookie).not.toContain('reactiveCookie=initialValue')
	})
	it('设置为null或空字符串应该删除Cookie', async () => {
		// 先设置一个cookie
		const { cookie } = useCookie('toBeDeleted', 'deleteMe')
		await nextTick()
		expect(document.cookie).toContain('toBeDeleted=deleteMe')
		// 设置为null应该删除
		// cookie.value = null;
		await nextTick()
		expect(document.cookie).not.toContain('toBeDeleted')
		// 再次设置
		cookie.value = 'newValue'
		await nextTick()
		// 设置为空字符串也应该删除
		cookie.value = ''
		await nextTick()
		expect(document.cookie).not.toContain('toBeDeleted')
	})
	it('应该支持Cookie选项', async () => {
		// 在HTTPS环境下模拟
		Object.defineProperty(window, 'location', {
			value: { protocol: 'https:' },
			configurable: true,
		})
		// 使用选项创建cookie
		const cookieOptions = {
			path: '/test',
			domain: 'example.com',
			secure: true,
			expires: 7, // 7天过期
		}
		const cookie = useCookie('optionsCookie', 'optionsValue', cookieOptions)
		await nextTick()
		// 验证cookie选项是否被应用
		const cookieString = document.cookie.mock.calls[0][0]
		expect(cookieString).toContain('optionsCookie=optionsValue')
		expect(cookieString).toContain('path=/test')
		expect(cookieString).toContain('domain=example.com')
		expect(cookieString).toContain('secure')
		// 验证过期时间（粗略检查）
		expect(cookieString).toContain('expires=')
	})
	it('在HTTPS环境下应该使用https前缀', async () => {
		// 设置HTTPS环境
		Object.defineProperty(window, 'location', {
			value: { protocol: 'https:' },
			configurable: true,
		})
		const cookie = useCookie('secureCookie', 'secureValue')
		await nextTick()
		// 验证cookie名称是否添加了https前缀
		expect(document.cookie).toContain('https_secureCookie=secureValue')
	})
})
//# sourceMappingURL=cookie.spec.js.map
