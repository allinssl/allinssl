import { promises as fs } from 'fs'
import path from 'path'

export class StateManager {
	constructor(options = {}) {
		const { statePath = './state', stateFile = 'plugin-state.json' } = options

		this.statePath = statePath
		this.stateFile = path.join(statePath, stateFile)
		this.state = {
			lastUpdate: null,
			processedFiles: new Set(),
			pendingTranslations: new Set(),
			failedTranslations: new Map(),
			statistics: {
				totalProcessed: 0,
				totalSuccess: 0,
				totalFailed: 0,
				cacheHits: 0,
			},
		}
	}

	/**
	 * 初始化状态
	 */
	async init() {
		try {
			await fs.mkdir(this.statePath, { recursive: true })
			if (await this.fileExists(this.stateFile)) {
				const data = await fs.readFile(this.stateFile, 'utf8')
				const savedState = JSON.parse(data)
				// 恢复集合和映射
				this.state = {
					...savedState,
					processedFiles: new Set(savedState.processedFiles),
					pendingTranslations: new Set(savedState.pendingTranslations),
					failedTranslations: new Map(savedState.failedTranslations),
				}
			}
		} catch (error) {
			console.error('初始化状态失败:', error)
		}
	}

	/**
	 * 保存状态
	 */
	async save() {
		try {
			const serializedState = {
				...this.state,
				lastUpdate: new Date().toISOString(),
				processedFiles: Array.from(this.state.processedFiles),
				pendingTranslations: Array.from(this.state.pendingTranslations),
				failedTranslations: Array.from(this.state.failedTranslations),
			}
			await fs.writeFile(this.stateFile, JSON.stringify(serializedState, null, 2))
		} catch (error) {
			console.error('保存状态失败:', error)
		}
	}

	/**
	 * 更新状态
	 * @param {Object} newState - 新的状态
	 */
	async updateState(newState) {
		this.state = {
			...this.state,
			...newState,
			lastUpdate: new Date().toISOString(),
		}
		await this.save()
	}

	/**
	 * 添加已处理文件
	 * @param {string} filePath - 文件路径
	 */
	async addProcessedFile(filePath) {
		this.state.processedFiles.add(filePath)
		this.state.statistics.totalProcessed++
		await this.save()
	}

	/**
	 * 添加待处理翻译
	 * @param {string} text - 待翻译文本
	 */
	async addPendingTranslation(text) {
		this.state.pendingTranslations.add(text)
		await this.save()
	}

	/**
	 * 添加失败的翻译
	 * @param {string} text - 待翻译文本
	 * @param {Error} error - 错误信息
	 */
	async addFailedTranslation(text, error) {
		this.state.failedTranslations.set(text, {
			error: error.message,
			timestamp: new Date().toISOString(),
		})
		this.state.statistics.totalFailed++
		await this.save()
	}

	/**
	 * 记录翻译成功
	 * @param {string} text - 翻译文本
	 */
	async recordTranslationSuccess(text) {
		this.state.pendingTranslations.delete(text)
		this.state.failedTranslations.delete(text)
		this.state.statistics.totalSuccess++
		await this.save()
	}

	/**
	 * 记录缓存命中
	 */
	async recordCacheHit() {
		this.state.statistics.cacheHits++
		await this.save()
	}

	/**
	 * 获取状态
	 * @returns {Object} - 当前状态
	 */
	getState() {
		return this.state
	}

	/**
	 * 获取统计信息
	 * @returns {Object} - 统计信息
	 */
	getStatistics() {
		return this.state.statistics
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

	/**
	 * 重置状态
	 */
	async reset() {
		this.state = {
			lastUpdate: null,
			processedFiles: new Set(),
			pendingTranslations: new Set(),
			failedTranslations: new Map(),
			statistics: {
				totalProcessed: 0,
				totalSuccess: 0,
				totalFailed: 0,
				cacheHits: 0,
			},
		}
		await this.save()
	}
}

/**
 * 翻译状态管理
 * 用于跟踪翻译进度和统计信息
 */
export class TranslationState {
	constructor() {
		// 文件处理统计
		this.filesProcessed = 0
		this.filesWithChineseText = 0

		// 翻译统计
		this.textsToTranslate = new Set() // 所有需要翻译的中文文本
		this.translatedTexts = 0 // 已翻译的中文文本数量
		this.cacheHits = 0 // 缓存命中次数
		this.cacheMisses = 0 // 缓存未命中次数

		// 中文文本到源文件的映射
		this.textToFiles = new Map() // 记录每个中文文本出现在哪些文件中
		this.fileTexts = new Map() // 记录每个文件包含哪些中文文本

		// 翻译键名映射
		this.textToKeyMap = new Map() // 中文文本到翻译键名的映射

		// 待处理的文件队列
		this.pendingFiles = []

		// 性能指标
		this.startTime = Date.now()
		this.endTime = null
	}

	/**
	 * 记录文件处理
	 * @param {string} filePath - 处理的文件路径
	 * @param {Set<string>} chineseTexts - 文件中提取的中文文本
	 */
	recordFileProcessed(filePath, chineseTexts) {
		this.filesProcessed++

		if (chineseTexts.size > 0) {
			this.filesWithChineseText++
			this.fileTexts.set(filePath, new Set(chineseTexts))

			// 更新中文文本到文件的映射
			chineseTexts.forEach((text) => {
				this.textsToTranslate.add(text)

				if (!this.textToFiles.has(text)) {
					this.textToFiles.set(text, new Set())
				}
				this.textToFiles.get(text).add(filePath)
			})
		}
	}

	/**
	 * 记录缓存命中
	 * @param {number} hitCount - 命中缓存的数量
	 */
	recordCacheHit(hitCount) {
		this.cacheHits += hitCount
	}

	/**
	 * 记录缓存未命中
	 * @param {number} missCount - 未命中缓存的数量
	 */
	recordCacheMiss(missCount) {
		this.cacheMisses += missCount
	}

	/**
	 * 记录翻译完成
	 * @param {number} count - 翻译完成的数量
	 */
	recordTranslated(count) {
		this.translatedTexts += count
	}

	/**
	 * 设置文本到键名的映射
	 * @param {string} text - 中文文本
	 * @param {string} key - 生成的翻译键名
	 */
	setTextToKeyMapping(text, key) {
		this.textToKeyMap.set(text, key)
	}

	/**
	 * 完成翻译过程
	 */
	complete() {
		this.endTime = Date.now()
	}

	/**
	 * 获取翻译状态摘要
	 * @returns {Object} - 翻译状态摘要
	 */
	getSummary() {
		const duration = (this.endTime || Date.now()) - this.startTime

		return {
			duration: `${(duration / 1000).toFixed(2)}秒`,
			filesProcessed: this.filesProcessed,
			filesWithChineseText: this.filesWithChineseText,
			uniqueChineseTexts: this.textsToTranslate.size,
			translatedTexts: this.translatedTexts,
			cacheHits: this.cacheHits,
			cacheMisses: this.cacheMisses,
			cacheHitRate:
				this.textsToTranslate.size > 0 ? `${((this.cacheHits / this.textsToTranslate.size) * 100).toFixed(2)}%` : '0%',
		}
	}

	/**
	 * 获取所有需要更新的文件及其对应的文本替换映射
	 * @returns {Map<string, Map<string, string>>} - 文件路径到文本替换映射的映射
	 */
	getFilesToUpdate() {
		const filesToUpdate = new Map()

		this.fileTexts.forEach((texts, filePath) => {
			const fileReplacements = new Map()
			texts.forEach((text) => {
				const key = this.textToKeyMap.get(text)
				if (key) {
					fileReplacements.set(text, key)
				}
			})

			if (fileReplacements.size > 0) {
				filesToUpdate.set(filePath, fileReplacements)
			}
		})

		return filesToUpdate
	}
}
