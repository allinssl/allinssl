import { promises as fs } from 'fs'
import path from 'path'
import { Utils } from '../utils/index.js'

export class CacheManager {
	constructor(cachePath) {
		this.cachePath = cachePath
		this.cache = new Map() // 缓存
		this.dirty = false // 是否需要保存缓存
	}

	/**
	 * 初始化缓存
	 */
	async initCache() {
		try {
			await fs.mkdir(path.dirname(this.cachePath), { recursive: true })
			if (await this.fileExists(this.cachePath)) {
				const data = await fs.readFile(this.cachePath, 'utf8')
				const cacheData = JSON.parse(data)
				this.cache = new Map(Object.entries(cacheData))
			}
		} catch (error) {
			console.error('初始化缓存失败:', error)
			this.cache = new Map()
		}
	}

	/**
	 * 获取缓存的翻译
	 * @param {string[]} texts - 待检查的中文内容列表
	 * @param {string[]} languages - 目标语言列表
	 * @returns {Promise<{cached: Object, uncached: string[]}>}
	 */
	async getCachedTranslations(texts, languages) {
		const cached = {}
		const uncached = []

		texts.forEach((text) => {
			const cachedItem = this.cache.get(text)
			// 检查缓存项是否存在且有效
			if (cachedItem && this.isValidCacheItem(cachedItem, languages)) {
				cached[text] = cachedItem
			} else {
				uncached.push(text)
			}
		})

		return { cached, uncached }
	}

	/**
	 * 更新缓存
	 * @param {string[]} texts - 中文内容列表
	 * @param {Object[]} translations - 翻译结果列表
	 * @param {string[]} languages - 目标语言列表
	 */
	async updateCache(texts, translations) {
		translations.forEach((translation, index) => {
			const text = texts[index]
			this.cache.set(text, {
				text,
				key: translation.key,
				translations: Utils.formatTranslations(translation.translations),
				timestamp: new Date().toISOString(),
			})
		})

		this.dirty = true
		await this.saveCache()
	}

	/**
	 * 清理缓存
	 * @param {string[]} validTexts - 有效的中文内容列表
	 */
	async cleanCache(validTexts) {
		const validTextSet = new Set(validTexts)
		for (const [text] of this.cache) {
			if (!validTextSet.has(text)) {
				this.cache.delete(text)
				this.dirty = true
			}
		}

		if (this.dirty) {
			await this.saveCache()
		}
	}

	/**
	 * 保存缓存
	 */
	async saveCache() {
		if (!this.dirty) return

		try {
			const cacheData = Object.fromEntries(this.cache)
			await fs.writeFile(this.cachePath, JSON.stringify(cacheData, null, 2))
			this.dirty = false
		} catch (error) {
			console.error('保存缓存失败:', error)
		}
	}

	/**
	 * 检查缓存项是否有效
	 * @param {Object} cacheItem - 缓存项
	 * @param {string[]} languages - 目标语言列表
	 * @returns {boolean}
	 */
	isValidCacheItem(cacheItem, languages) {
		return cacheItem && cacheItem.translations && languages.every((lang) => cacheItem.translations[lang])
	}

	/**
	 * 检查文件是否存在
	 * @param {string} filePath - 文件路径
	 * @returns {Promise<boolean>}
	 */
	async fileExists(filePath) {
		try {
			await fs.access(filePath)
			return true
		} catch {
			return false
		}
	}
}

export default CacheManager
