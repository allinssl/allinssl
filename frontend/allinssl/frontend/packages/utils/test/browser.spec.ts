import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as browserUtils from '../src/browser'

describe('浏览器工具函数测试', () => {
	beforeEach(() => {
		vi.resetModules() // 清理所有模拟和存储
		localStorage.clear()
		sessionStorage.clear()
		document.cookie = ''
	})

	describe('环境检测', () => {
		describe('isHttps', () => {
			it('应当正确判断 HTTPS 协议', () => {
				const locationSpy = vi.spyOn(window, 'location', 'get')
				locationSpy.mockReturnValue({ protocol: 'https:' } as Location)
				expect(browserUtils.isHttps()).toBe(true)
				locationSpy.mockRestore()
			})

			it('应当正确判断非 HTTPS 协议', () => {
				const locationSpy = vi.spyOn(window, 'location', 'get')
				locationSpy.mockReturnValue({ protocol: 'http:' } as Location)
				expect(browserUtils.isHttps()).toBe(false)
				locationSpy.mockRestore()
			})
		})

		describe('isDev', () => {
			it('应当正确判断开发环境', () => {
				const originalEnv = process.env.NODE_ENV
				process.env.NODE_ENV = 'development'
				expect(browserUtils.isDev()).toBe(true)
				process.env.NODE_ENV = originalEnv
			})

			it('应当正确判断非开发环境', () => {
				const originalEnv = process.env.NODE_ENV
				process.env.NODE_ENV = 'production'
				expect(browserUtils.isDev()).toBe(false)
				process.env.NODE_ENV = originalEnv
			})
		})
	})

	describe('浏览器信息获取', () => {
		describe('getBrowserOSInfo', () => {
			it.each([
				[
					'Chrome',
					'Windows',
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				],
				['Firefox', 'macOS', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0'],
				[
					'Safari',
					'iOS',
					'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
				],
				[
					'Edge',
					'Windows',
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
				],
				['Unknown', 'Linux', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)'],
			])('应当正确识别 %s 浏览器和 %s 系统', (browser, os, userAgent) => {
				Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true })
				const info = browserUtils.getBrowserOSInfo()
				expect(info.browser).toBe(browser)
				expect(info.os).toBe(os)
			})
		})

		describe('getScreenInfo', () => {
			it('应当返回正确的屏幕信息', () => {
				Object.defineProperty(window, 'screen', {
					value: { width: 1920, height: 1080 },
					configurable: true,
				})
				Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true })

				const screenInfo = browserUtils.getScreenInfo()
				expect(screenInfo.resolution).toBe('1920x1080')
				expect(screenInfo.scale).toBe(2)
			})
		})
	})

	describe('URL参数操作', () => {
		describe('getUrlParam', () => {
			it('应当正确获取URL参数', () => {
				const locationSpy = vi.spyOn(window, 'location', 'get')
				locationSpy.mockReturnValue({ search: '?name=test&age=25&empty=&special=%20%26' } as Location)
				expect(browserUtils.getUrlParam('name')).toBe('test')
				expect(browserUtils.getUrlParam('age')).toBe('25')
				expect(browserUtils.getUrlParam('empty')).toBe('')
				expect(browserUtils.getUrlParam('special')).toBe(' &')
				expect(browserUtils.getUrlParam('notexist')).toBeNull()

				locationSpy.mockRestore()
			})
		})
	})

	describe('存储操作', () => {
		describe('Storage API', () => {
			const testData = { name: 'test', value: 123, nested: { key: 'value' } }
			const testKey = 'testKey'

			describe('localStorage', () => {
				it('应当正确设置和获取数据', () => {
					browserUtils.setLocalItem(testKey, testData)
					expect(browserUtils.getLocalItem(testKey)).toEqual(testData)
				})

				it('应当正确删除数据', () => {
					browserUtils.setLocalItem(testKey, testData)
					browserUtils.removeLocalItem(testKey)
					expect(browserUtils.getLocalItem(testKey)).toBeNull()
				})

				it('应当正确清空所有数据', () => {
					browserUtils.setLocalItem(testKey, testData)
					browserUtils.setLocalItem('otherKey', 'value')
					browserUtils.clearLocal()
					expect(browserUtils.getLocalItem(testKey)).toBeNull()
					expect(browserUtils.getLocalItem('otherKey')).toBeNull()
				})
			})

			describe('sessionStorage', () => {
				it('应当正确设置和获取数据', () => {
					browserUtils.setSessionItem(testKey, testData)
					expect(browserUtils.getSessionItem(testKey)).toEqual(testData)
				})

				it('应当正确删除数据', () => {
					browserUtils.setSessionItem(testKey, testData)
					browserUtils.removeSessionItem(testKey)
					expect(browserUtils.getSessionItem(testKey)).toBeNull()
				})

				it('应当正确清空所有数据', () => {
					browserUtils.setSessionItem(testKey, testData)
					browserUtils.setSessionItem('otherKey', 'value')
					browserUtils.clearSession()
					expect(browserUtils.getSessionItem(testKey)).toBeNull()
					expect(browserUtils.getSessionItem('otherKey')).toBeNull()
				})
			})
		})

		describe('Cookie API', () => {
			const testKey = 'testKey'
			const testValue = 'testValue'

			beforeEach(() => {
				// 清除所有 cookie
				document.cookie.split(';').forEach((cookie) => {
					const [key] = cookie.split('=')
					document.cookie = `${key}=;expires=${new Date(0).toUTCString()};path=/`
				})
			})

			it('应当正确设置和获取 cookie', () => {
				browserUtils.setCookie(testKey, testValue)
				expect(browserUtils.getCookie(testKey)).toBe(testValue)
			})

			it('应当正确设置带过期时间的 cookie', () => {
				browserUtils.setCookie(testKey, testValue, 1)
				expect(browserUtils.getCookie(testKey)).toBe(testValue)
			})

			it('应当正确处理特殊字符', () => {
				const specialValue = 'test value with spaces & special chars'
				browserUtils.setCookie(testKey, specialValue)
				expect(browserUtils.getCookie(testKey)).toBe(specialValue)
			})

			it('应当正确删除 cookie', () => {
				browserUtils.setCookie(testKey, testValue)
				browserUtils.deleteCookie(testKey)
				expect(browserUtils.getCookie(testKey)).toBeNull()
			})

			it('应当正确清空所有 cookie', () => {
				browserUtils.setCookie(testKey, testValue)
				browserUtils.setCookie('otherKey', 'otherValue')
				browserUtils.clearCookie()
				expect(browserUtils.getCookie(testKey)).toBeNull()
				expect(browserUtils.getCookie('otherKey')).toBeNull()
			})

			it('应当正确处理 HTTPS 前缀', () => {
				const locationSpy = vi.spyOn(window, 'location', 'get')
				locationSpy.mockReturnValue({ protocol: 'https:' } as Location)

				browserUtils.setCookie(testKey, testValue)
				expect(browserUtils.getCookie(testKey)).toBe(testValue)
				expect(document.cookie).toContain('https_')

				locationSpy.mockRestore()
			})
		})
	})

	describe('柯里化函数', () => {
		it('应当正确使用柯里化版本的 getUrlParam', () => {
			const locationSpy = vi.spyOn(window, 'location', 'get')
			locationSpy.mockReturnValue({ search: '?name=test&age=25' } as Location)

			expect(browserUtils.getUrlParamCurried('name')).toBe('test')
			expect(browserUtils.getUrlParamCurried('age')).toBe('25')

			locationSpy.mockRestore()
		})

		it('应当正确使用柯里化版本的 setCookie', () => {
			const setCookieForKey = browserUtils.setCookieCurried('testKey')
			setCookieForKey('testValue', 1)
			expect(browserUtils.getCookie('testKey')).toBe('testValue')
		})

		it('应当正确使用柯里化版本的 getCookie', () => {
			browserUtils.setCookie('testKey', 'testValue')
			expect(browserUtils.getCookieCurried('testKey')).toBe('testValue')
		})

		it('应当正确使用柯里化版本的 setStorageItem', () => {
			const setItemForKey = browserUtils.setStorageItemCurried('testKey')
			const testData = { test: 'value' }
			setItemForKey(testData, localStorage)
			expect(JSON.parse(localStorage.getItem('testKey') || '')).toEqual(testData)
		})

		it('应当正确使用柯里化版本的 getStorageItem', () => {
			const testData = { test: 'value' }
			localStorage.setItem('testKey', JSON.stringify(testData))
			expect(browserUtils.getStorageItemCurried('testKey')(localStorage)).toEqual(testData)
		})
	})

	describe('IndexedDB', () => {
		let dbManager: browserUtils.IndexedDBManager
		const testConfig: browserUtils.IndexedDBConfig = {
			dbName: 'testDB',
			version: 1,
			stores: {
				users: {
					keyPath: 'id',
					indexes: [
						{ name: 'name', keyPath: 'name' },
						{ name: 'email', keyPath: 'email', options: { unique: true } },
					],
				},
			},
		}

		beforeEach(async () => {
			// 确保在创建新的数据库管理器之前删除旧的数据库
			await new Promise<void>((resolve) => {
				const deleteRequest = indexedDB.deleteDatabase(testConfig.dbName)
				deleteRequest.onsuccess = () => resolve()
				deleteRequest.onerror = () => resolve() // 即使出错也继续
				deleteRequest.onblocked = () => resolve() // 处理阻塞情况
			})

			// 创建新的数据库管理器实例
			dbManager = new browserUtils.IndexedDBManager(testConfig)

			// 等待数据库连接和初始化完成
			await dbManager.connect()
		})

		afterEach(async () => {
			// 关闭数据库连接
			if (dbManager) {
				dbManager.close()
			}

			// 删除测试数据库
			await new Promise<void>((resolve) => {
				const deleteRequest = indexedDB.deleteDatabase(testConfig.dbName)
				deleteRequest.onsuccess = () => resolve()
				deleteRequest.onerror = () => resolve() // 即使出错也继续
				deleteRequest.onblocked = () => {
					// 等待连接关闭后继续
					setTimeout(resolve, 100)
				}
			})
		})

		it('应当正确连接数据库', async () => {
			const db = await dbManager.connect()
			expect(db).toBeDefined()
			expect(db.name).toBe(testConfig.dbName)
			expect(db.version).toBe(testConfig.version)
			expect(Array.from(db.objectStoreNames)).toContain('users')
		})

		it('应当正确添加和获取数据', async () => {
			const testUser = { id: 1, name: 'Test User', email: 'test@example.com' }

			// 添加数据
			await dbManager.add('users', testUser)

			// 获取数据
			const result = await dbManager.get('users', 1)
			expect(result).toEqual(testUser)
		})

		it('应当正确更新数据', async () => {
			const testUser = { id: 1, name: 'Test User', email: 'test@example.com' }
			await dbManager.add('users', testUser)

			const updatedUser = { ...testUser, name: 'Updated User' }
			await dbManager.put('users', updatedUser)

			const result = await dbManager.get('users', 1)
			expect(result).toEqual(updatedUser)
		})

		it('应当正确删除数据', async () => {
			const testUser = { id: 1, name: 'Test User', email: 'test@example.com' }
			await dbManager.add('users', testUser)
			await dbManager.delete('users', 1)

			const result = await dbManager.get('users', 1)
			expect(result).toBeUndefined()
		})

		it('应当正确通过索引查询数据', async () => {
			const testUser = { id: 1, name: 'Test User', email: 'test@example.com' }
			await dbManager.add('users', testUser)

			const result = await dbManager.getByIndex('users', 'email', 'test@example.com')
			expect(result).toEqual(testUser)
		})

		it('应当正确获取所有数据', async () => {
			const users = [
				{ id: 1, name: 'User 1', email: 'user1@example.com' },
				{ id: 2, name: 'User 2', email: 'user2@example.com' },
			]

			await dbManager.addBatch('users', users)
			const results = await dbManager.getAll('users')

			expect(results).toHaveLength(2)
			expect(results).toEqual(expect.arrayContaining(users))
		})

		it('应当正确遍历数据', async () => {
			const users = [
				{ id: 1, name: 'User 1', email: 'user1@example.com' },
				{ id: 2, name: 'User 2', email: 'user2@example.com' },
			]
			await dbManager.addBatch('users', users)

			const results: typeof users = []
			await dbManager.forEach<(typeof users)[0]>('users', (item) => {
				results.push(item)
			})

			expect(results).toHaveLength(2)
			expect(results).toEqual(expect.arrayContaining(users))
		})

		it('应当正确清空数据', async () => {
			const users = [
				{ id: 1, name: 'User 1', email: 'user1@example.com' },
				{ id: 2, name: 'User 2', email: 'user2@example.com' },
			]
			await dbManager.addBatch('users', users)
			await dbManager.clear('users')

			const results = await dbManager.getAll('users')
			expect(results).toHaveLength(0)
		})
	})
})
