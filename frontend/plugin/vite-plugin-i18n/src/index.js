import { CacheManager } from './cache/index.js'
import { FileOperation } from './fileOperation/index.js'
import { AIBatchAdapter } from './translation/adapter/aiBatchAdapter.js'
import { TranslationState } from './stateManagement/index.js'
import { Utils } from './utils/index.js'
import { UnusedTranslationDetector } from './cleanUp/unusedTranslationDetector.js'
import configFile from './config/config.js'
import path from 'path'

/**
 * Vite i18n 自动翻译插件
 * @param {Object} options - 插件配置
 */
export function vitePluginI18nAiTranslate(options = {}) {
	const config = {
		...configFile,
		...options,
		templateRegex: new RegExp(configFile.templateRegex, 'g'), // Convert string to RegExp
	}

	const cacheManager = new CacheManager(config.cachePath) // 缓存管理
	const fileOperation = new FileOperation() // 文件操作
	const translator = new AIBatchAdapter() // AI 批量翻译
	const translationState = new TranslationState() // 翻译状态管理
	const unusedDetector = new UnusedTranslationDetector(fileOperation, cacheManager) // 未使用翻译检测器

	let watcher = null
	let outputDirCreated = false // 跟踪输出目录是否已创建
	let isProcessing = false // 跟踪是否正在进行批量处理

	/**
	 * 处理文件并提取中文文本
	 * @param {string[]} files - 要处理的文件路径列表
	 */
	const processFiles = async (files) => {
		// 如果已经在处理中，则跳过
		if (isProcessing) {
			console.log(`[i18n插件] 已有处理正在进行中，跳过本次请求`)
			return
		}

		try {
			// 设置处理标志
			isProcessing = true

			console.log(`[i18n插件] 开始处理 ${files.length} 个文件...`)

			// 第一步：扫描所有文件并提取中文文本
			for (const file of files) {
				try {
					const content = await fileOperation.readFile(file) // 读取文件内容
					const chineseTexts = extractChineseTexts(content) // 提取中文文本
					// console.log(`[i18n插件] 提取 ${chineseTexts} 个中文文本`)
					translationState.recordFileProcessed(file, chineseTexts) // 记录处理的文件
				} catch (error) {
					console.error(`[i18n插件] 处理文件 ${file} 失败:`, error)
				}
			}
			// 第二步：对比缓存，确定需要翻译的内容
			await translateAndProcess()
		} finally {
			// 无论处理成功还是失败，都重置处理标志
			isProcessing = false
		}
	}

	/**
	 * 翻译文本并处理结果
	 */
	const translateAndProcess = async () => {
		// 如果没有需要翻译的文本，直接返回
		const textsArray = Array.from(translationState.textsToTranslate)

		// 获取缓存的翻译
		const { cached, uncached } = await cacheManager.getCachedTranslations(textsArray, config.languages)

		// 记录缓存命中情况
		translationState.recordCacheHit(Object.keys(cached).length)
		translationState.recordCacheMiss(uncached.length)
		console.log(`[i18n插件] 缓存命中: ${Object.keys(cached).length} 个, 需要翻译: ${uncached.length} 个`)

		// 所有翻译结果（包括缓存和新翻译）
		let allTranslations = { ...cached }

		// 如果有未缓存的内容，进行翻译
		if (uncached.length > 0) {
			const translations = await translateTexts(uncached)
			// 更新缓存
			await cacheManager.updateCache(uncached, translations, config.languages)

			// 合并新翻译结果
			translations.forEach((translation) => {
				allTranslations[translation.text] = translation
			})

			// 记录新翻译的数量
			translationState.recordTranslated(translations.length)
		}

		// 如果没有新的翻译内容或缓存，获取完整的缓存内容
		if (!Object.keys(allTranslations).length) {
			console.log(`[i18n插件] 没有新的翻译内容，使用完整缓存`)
			const cacheEntries = Array.from(cacheManager.cache.entries())
			cacheEntries.forEach(([text, data]) => {
				allTranslations[text] = {
					text,
					key: data.key,
					translations: data.translations,
				}
			})
		}

		// 合并历史缓存和当前批次翻译内容
		const cacheEntries = Array.from(cacheManager.cache.entries())
		cacheEntries.forEach(([text, data]) => {
			if (!allTranslations[text]) {
				allTranslations[text] = {
					text,
					key: data.key,
					translations: data.translations,
				}
			}
		})

		// 第三步：为每个中文文本生成唯一的键名，并建立映射关系
		for (const [text, translation] of Object.entries(allTranslations)) {
			translationState.setTextToKeyMapping(text, translation.key)
		}

		// 第四步：一次性生成翻译文件（不再每次都检测目录）
		await generateTranslationFiles(allTranslations)

		// 第五步：替换源文件中的中文文本为翻译键名
		await replaceSourceTexts()

		// 完成并输出统计信息
		translationState.complete()
		outputStatistics()
	}

	/**
	 * 提取中文文本
	 * @param {string} content - 文件内容
	 * @returns {Set<string>} - 中文文本集合
	 */
	const extractChineseTexts = (content) => {
		const texts = new Set()
		// 重置正则表达式的lastIndex，确保从头开始匹配
		config.templateRegex.lastIndex = 0
		let match
		while ((match = config.templateRegex.exec(content)) !== null) {
			texts.add(match[1])
			console.log(`[i18n插件] 提取中文文本: ${match[1]}`)
		}
		return texts
	}

	/**
	 * 翻译文本
	 * @param {string[]} texts - 待翻译的文本列表
	 * @returns {Promise<Object[]>} - 翻译结果列表
	 */
	const translateTexts = async (texts) => {
		const results = []
		const chunks = chunkArray(texts, config.concurrency)

		console.log(`[i18n插件] 开始翻译 ${texts.length} 个文本，分为 ${chunks.length} 批处理`)

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i]
			console.log(`[i18n插件] 正在处理第 ${i + 1}/${chunks.length} 批 (${chunk.length} 个文本)`)

			const promises = chunk.map((text, index) => {
				return translator.translate(text, config.languages, config.maxRetries, index)
			})

			const chunkResults = await Promise.all(promises)
			results.push(...chunkResults)

			// 等待请求间隔
			if (config.requestInterval > 0 && i < chunks.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, config.requestInterval))
			}
		}

		return results
	}

	/**
	 * 生成翻译文件
	 * @param {Object} translations - 翻译结果
	 */
	const generateTranslationFiles = async (translations) => {
		// 确保输出目录存在（仅检查一次）
		if (!outputDirCreated) {
			await fileOperation.createDirectory(path.join(config.outputPath, 'model'))
			outputDirCreated = true
		}

		console.log(`[i18n插件] 正在生成 ${config.languages.length} 个语言的翻译文件`)

		// 构建每种语言的翻译结构
		const languageTranslations = {}

		// 初始化每种语言的翻译对象
		for (const language of config.languages) {
			languageTranslations[language] = {}
		}

		console.log(translations, Object.entries(translations).length)
		// 构建翻译键值对
		for (const [text, data] of Object.entries(translations)) {
			// 生成翻译键名
			const key = translationState.textToKeyMap.get(text) || Utils.renderTranslateName(text)

			console.log(`[i18n插件] 生成翻译键名: ${key} -> ${text}`)
			// 为每种语言添加翻译
			for (const language of config.languages) {
				languageTranslations[language][key] = data.translations[language]
			}
		}
		// console.log(languageTranslations)
		// 一次性写入每种语言的翻译文件
		const writePromises = config.languages.map((language) =>
			fileOperation.generateTranslationFile(
				path.join(config.outputPath, 'model'),
				languageTranslations[language],
				language,
			),
		)
		await Promise.all(writePromises)
		console.log(`[i18n插件] 翻译文件生成完成`)
		// 创建入口文件
		await createI18nEntryFile()
	}

	/**
	 * 替换源文件中的中文文本为翻译键名
	 */
	const replaceSourceTexts = async () => {
		// 获取所有需要更新的文件
		const filesToUpdate = translationState.getFilesToUpdate()

		console.log(`[i18n插件] 正在替换 ${filesToUpdate.size} 个文件中的中文文本`)

		// 处理每个需要更新的文件
		for (const [filePath, replacements] of filesToUpdate.entries()) {
			try {
				// 读取文件内容
				let content = await fileOperation.readFile(filePath)

				// 获取文件相对于项目的命名空间
				// const namespace = Utils.getNamespace(filePath, config.projectPath);

				// 替换每个中文文本为$t('键名')
				for (const [text, baseKey] of replacements.entries()) {
					// 在替换时为每个文件中的键添加命名空间前缀
					// const key = namespace ? `${namespace}.${baseKey}` : baseKey;
					// 创建正则表达式，匹配$t('中文文本')或$t("中文文本")
					const regex = new RegExp(`\\$t\\(['"]${escapeRegExp(text)}['"]`, 'g')
					content = content.replace(regex, `$t('${baseKey}'`)
				}

				// 写入更新后的文件内容
				await fileOperation.modifyFile(filePath, content)
			} catch (error) {
				console.error(`[i18n插件] 替换文件 ${filePath} 内容失败:`, error)
			}
		}
	}

	/**
	 * 创建i18n入口文件
	 */
	const createI18nEntryFile = async () => {
		try {
			// 创建i18n入口文件内容
			const entryFileContent = `// 自动生成的i18n入口文件
// 自动生成的i18n入口文件
import { useLocale } from '@baota/i18n'
import zhCN from './model/zhCN${config.createFileExt}'
import enUS from './model/enUS${config.createFileExt}'

// 使用 i18n 插件
export const { i18n, $t, locale, localeOptions } = useLocale(
	{
		messages: { zhCN, enUS },
		locale: 'zhCN',
		fileExt: 'json'
	},
	import.meta.glob([\`./model/*${config.createFileExt}\`], {
		eager: false,
	}),
)

`

			// 写入i18n入口文件
			const entryFilePath = path.join(config.outputPath, `index${config.createEntryFileExt}`)
			await fileOperation.createFile(entryFilePath, entryFileContent)
			console.log(`[i18n插件] 已创建i18n入口文件: ${entryFilePath}`)
		} catch (error) {
			console.error(`[i18n插件] 创建i18n入口文件失败:`, error)
		}
	}

	/**
	 * 输出翻译统计信息
	 */
	const outputStatistics = () => {
		const summary = translationState.getSummary()
		console.log('\n======= i18n翻译插件执行统计 =======')
		console.log(`总耗时: ${summary.duration}`)
		console.log(`处理文件数: ${summary.filesProcessed}`)
		console.log(`包含中文文本的文件数: ${summary.filesWithChineseText}`)
		console.log(`唯一中文文本数: ${summary.uniqueChineseTexts}`)
		console.log(`命中缓存: ${summary.cacheHits} 条`)
		console.log(`新翻译: ${summary.translatedTexts} 条`)
		console.log(`缓存命中率: ${summary.cacheHitRate}`)
		console.log('===================================\n')
	}

	/**
	 * 将数组分块
	 * @param {Array} array - 待分块的数组
	 * @param {number} size - 块大小
	 * @returns {Array[]} - 分块后的数组
	 */
	const chunkArray = (array, size) => {
		const chunks = []
		for (let i = 0; i < array.length; i += size) {
			chunks.push(array.slice(i, i + size))
		}
		return chunks
	}

	/**
	 * 转义正则表达式特殊字符
	 * @param {string} string - 需要转义的字符串
	 * @returns {string} - 转义后的字符串
	 */
	const escapeRegExp = (string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}

	/**
	 * 清理未使用的翻译
	 * @param {string[]} files - 要扫描的文件列表
	 * @returns {Promise<{removedCount: number}>} - 清理结果
	 */
	const cleanupUnusedTranslations = async (files) => {
		if (isProcessing) {
			console.log(`[i18n插件] 已有处理正在进行中，跳过未使用翻译清理`)
			return { removedCount: 0 }
		}

		try {
			isProcessing = true
			// 执行未使用翻译检查和清理
			const result = await unusedDetector.cleanUnusedTranslations(config, files)
			return result
		} finally {
			isProcessing = false
		}
	}

	return {
		name: 'vite-plugin-i18n-ai-translate',

		// 解析配置时的钩子
		async configResolved() {
			// 初始化缓存
			await cacheManager.initCache()

			// 确保输出目录存在（仅初始化一次）
			await fileOperation.createDirectory(path.join(config.outputPath, 'model'))
			outputDirCreated = true
		},

		// 配置服务器时的钩子
		async configureServer(server) {
			// 生成规则
			const globFiles = config.fileExtensions.map((ext) => `**/*${ext}`)

			// 获取所有文件
			const files = await fileOperation.scanFiles(globFiles, config.projectPath)

			// 批量处理所有文件
			await processFiles(files)

			// 设置文件监听
			// watcher = server.watcher
			// watcher.on('change', async (file) => {
			// 	// 只有在未处理状态且文件扩展名匹配时才处理变更
			// 	// 排除指定目录
			// 	if (config.exclude.some((item) => file.includes(item))) return
			// 	if (!isProcessing && config.fileExtensions.some((ext) => file.endsWith(ext))) {
			// 		// console.log(`[i18n插件] 检测到文件变更: ${file}`);
			// 		await processFiles([file])
			// 	}
			// })
		},

		// 关闭打包时的钩子
		async closeBundle() {
			if (watcher) {
				watcher.close()
			}
		},

		// 导出额外功能
		cleanupUnusedTranslations,
	}
}

export default vitePluginI18nAiTranslate
