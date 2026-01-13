import { jest } from '@jest/globals'
import { promises as fs } from 'fs'
import path from 'path'
import { CacheManager } from '../src/cache/index.js'

jest.mock('fs', () => ({
	promises: {
		mkdir: jest.fn(),
		readFile: jest.fn(),
		writeFile: jest.fn(),
		access: jest.fn(),
	},
}))

describe('CacheManager', () => {
	const cachePath = './test-cache.json'
	let cacheManager

	beforeEach(() => {
		cacheManager = new CacheManager(cachePath)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('initCache', () => {
		it('应该正确初始化缓存', async () => {
			const mockCacheData = {
				test: {
					text: 'test',
					translations: { enUS: 'test' },
					timestamp: '2023-01-01T00:00:00.000Z',
				},
			}

			fs.access.mockResolvedValueOnce()
			fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCacheData))

			await cacheManager.initCache()
			expect(cacheManager.cache.get('test')).toEqual(mockCacheData.test)
		})

		it('处理缓存文件不存在的情况', async () => {
			fs.access.mockRejectedValueOnce(new Error('文件不存在'))

			await cacheManager.initCache()
			expect(cacheManager.cache.size).toBe(0)
		})
	})

	describe('getCachedTranslations', () => {
		beforeEach(async () => {
			cacheManager.cache.set('hello', {
				text: 'hello',
				translations: {
					enUS: 'Hello',
					jaJP: 'こんにちは',
				},
				timestamp: '2023-01-01T00:00:00.000Z',
			})
		})

		it('应该返回缓存的翻译', async () => {
			const texts = ['hello', 'world']
			const languages = ['enUS', 'jaJP']

			const { cached, uncached } = await cacheManager.getCachedTranslations(texts, languages)

			expect(cached.hello).toBeDefined()
			expect(uncached).toContain('world')
		})

		it('检查缓存项是否包含所有必要的语言', async () => {
			const texts = ['hello']
			const languages = ['enUS', 'jaJP', 'zhCN']

			const { cached, uncached } = await cacheManager.getCachedTranslations(texts, languages)

			expect(uncached).toContain('hello')
			expect(Object.keys(cached)).toHaveLength(0)
		})
	})

	describe('updateCache', () => {
		it('应该正确更新缓存', async () => {
			const texts = ['test']
			const translations = [
				{
					text: 'test',
					translations: {
						enUS: 'Test',
						jaJP: 'テスト',
					},
				},
			]
			const languages = ['enUS', 'jaJP']

			await cacheManager.updateCache(texts, translations, languages)

			const cached = cacheManager.cache.get('test')
			expect(cached.translations.enUS).toBe('Test')
			expect(cached.translations.jaJP).toBe('テスト')
			expect(fs.writeFile).toHaveBeenCalled()
		})
	})

	describe('cleanCache', () => {
		it('应该删除无效的缓存项', async () => {
			cacheManager.cache.set('valid', { text: 'valid' })
			cacheManager.cache.set('invalid', { text: 'invalid' })

			await cacheManager.cleanCache(['valid'])

			expect(cacheManager.cache.has('valid')).toBe(true)
			expect(cacheManager.cache.has('invalid')).toBe(false)
			expect(fs.writeFile).toHaveBeenCalled()
		})
	})
})
