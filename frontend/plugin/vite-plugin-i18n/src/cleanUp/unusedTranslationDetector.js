import path from 'path'

/**
 * 未使用翻译检测器
 * 负责检测和移除未使用的翻译内容
 */
export class UnusedTranslationDetector {
	/**
	 * @param {Object} fileOperation - 文件操作实例
	 * @param {Object} cacheManager - 缓存管理实例
	 */
	constructor(fileOperation, cacheManager) {
		this.fileOperation = fileOperation
		this.cacheManager = cacheManager
	}

	/**
	 * 扫描项目中实际使用的翻译键
	 * @param {string[]} files - 要扫描的文件列表
	 * @param {RegExp} keyUsageRegex - 匹配翻译键使用的正则表达式
	 * @returns {Promise<Set<string>>} - 项目中使用的翻译键集合
	 */
	async scanUsedTranslationKeys(files, keyUsageRegex) {
		const usedKeys = new Set()
		for (const file of files) {
			try {
				const content = await this.fileOperation.readFile(file)
				// 重置正则表达式的lastIndex，确保从头开始匹配
				keyUsageRegex.lastIndex = 0
				let match
				while ((match = keyUsageRegex.exec(content)) !== null) {
					if (match[1]) {
						usedKeys.add(match[1].trim())
					}
				}
			} catch (error) {
				console.error(`[i18n插件] 扫描文件 ${file} 中使用的翻译键失败:`, error)
			}
		}

		return usedKeys
	}

	/**
	 * 从翻译文件中加载所有翻译键
	 * @param {string} translationDir - 翻译文件目录
	 * @param {string[]} languages - 语言列表
	 * @returns {Promise<Map<string, Object>>} - 键到翻译对象的映射
	 */
	async loadAllTranslations(translationDir, languages) {
		const allTranslations = new Map()

		for (const language of languages) {
			const filePath = path.join(translationDir, `${language}.json`)

			try {
				if (await this.fileOperation.fileExists(filePath)) {
					const content = await this.fileOperation.readFile(filePath)
					const translations = JSON.parse(content)

					// 将每个键加入到总映射中
					for (const [key, value] of Object.entries(translations)) {
						if (!allTranslations.has(key)) {
							allTranslations.set(key, { key, translations: {} })
						}

						const translationObj = allTranslations.get(key)
						translationObj.translations[language] = value
					}
				}
			} catch (error) {
				console.error(`[i18n插件] 加载翻译文件 ${filePath} 失败:`, error)
			}
		}

		return allTranslations
	}

	/**
	 * 检测未使用的翻译
	 * @param {Set<string>} usedKeys - 使用的翻译键集合
	 * @param {Map<string, Object>} allTranslations - 所有翻译
	 * @returns {Set<string>} - 未使用的翻译键集合
	 */
	detectUnusedTranslations(usedKeys, allTranslations) {
		const unusedKeys = new Set()

		for (const [key] of allTranslations.entries()) {
			if (!usedKeys.has(key)) {
				unusedKeys.add(key)
			}
		}

		return unusedKeys
	}

	/**
	 * 从翻译文件中移除未使用的翻译
	 * @param {Set<string>} unusedKeys - 未使用的翻译键集合
	 * @param {string} translationDir - 翻译文件目录
	 * @param {string[]} languages - 语言列表
	 * @returns {Promise<number>} - 移除的翻译数量
	 */
	async removeUnusedTranslations(unusedKeys, translationDir, languages) {
		let removedCount = 0

		for (const language of languages) {
			const filePath = path.join(translationDir, `${language}.json`)

			try {
				if (await this.fileOperation.fileExists(filePath)) {
					const content = await this.fileOperation.readFile(filePath)
					const translations = JSON.parse(content)
					let hasChanges = false

					// 移除未使用的翻译
					for (const key of unusedKeys) {
						if (key in translations) {
							delete translations[key]
							hasChanges = true

							if (language === languages[0]) {
								// 只在处理第一种语言时计数，避免重复计数
								removedCount++
							}
						}
					}

					// 如果有变更，更新文件
					if (hasChanges) {
						await this.fileOperation.modifyFile(filePath, JSON.stringify(translations, null, 2))
					}
				}
			} catch (error) {
				console.error(`[i18n插件] 更新翻译文件 ${filePath} 失败:`, error)
			}
		}

		return removedCount
	}

	/**
	 * 从缓存中移除未使用的翻译
	 * @param {Map<string, Object>} allTranslations - 所有翻译
	 * @param {Set<string>} unusedKeys - 未使用的翻译键集合
	 * @returns {Promise<void>}
	 */
	async removeUnusedFromCache(allTranslations, unusedKeys) {
		// 构建需要保留的中文文本列表
		const validTexts = []

		for (const [key, translationObj] of allTranslations.entries()) {
			if (!unusedKeys.has(key)) {
				// 如果有原始中文文本，添加到有效列表中
				if (translationObj.text) {
					validTexts.push(translationObj.text)
				}
			}
		}

		// 清理缓存
		await this.cacheManager.cleanCache(validTexts)
	}

	/**
	 * 执行未使用翻译检查和清理
	 * @param {Object} config - 配置对象
	 * @param {string[]} files - 要扫描的文件列表
	 * @returns {Promise<{removedCount: number}>} - 清理结果
	 */
	async cleanUnusedTranslations(config, files) {
		console.log(`[i18n插件] 开始检测未使用的翻译...`)

		// 创建匹配翻译键使用的正则表达式: $t('key') 或 $t("key")
		const keyUsageRegex = new RegExp(/\$t\(['"](.+?)['"]\)/g)

		// 扫描使用的翻译键
		const usedKeys = await this.scanUsedTranslationKeys(files, keyUsageRegex)
		console.log(`[i18n插件] 扫描到 ${usedKeys.size} 个使用中的翻译键`)

		// 加载所有翻译
		const translationDir = path.join(config.outputPath, 'model')
		const allTranslations = await this.loadAllTranslations(translationDir, config.languages)
		console.log(`[i18n插件] 加载了 ${allTranslations.size} 个翻译键`)

		// 检测未使用的翻译
		const unusedKeys = this.detectUnusedTranslations(usedKeys, allTranslations)
		console.log(`[i18n插件] 检测到 ${unusedKeys.size} 个未使用的翻译键`)

		if (unusedKeys.size === 0) {
			console.log(`[i18n插件] 没有发现未使用的翻译，无需清理`)
			return { removedCount: 0 }
		}

		// 移除未使用的翻译
		const removedCount = await this.removeUnusedTranslations(unusedKeys, translationDir, config.languages)

		// 从缓存中移除未使用的翻译
		await this.removeUnusedFromCache(allTranslations, unusedKeys)

		console.log(`[i18n插件] 已从翻译文件和缓存中移除 ${removedCount} 个未使用的翻译`)

		return { removedCount }
	}
}

export default UnusedTranslationDetector
