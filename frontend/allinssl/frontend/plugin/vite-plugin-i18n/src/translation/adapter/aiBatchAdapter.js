import { TranslationAdapter } from './index.js'
import { ZhipuAITranslator } from '../ai/zhipuAI.js'
import { QianwenAITranslator } from '../ai/qianwenAI.js'
import { DeepSeekAITranslator } from '../ai/deepseekAI.js'
import { LinuxDoAITranslator } from '../ai/linuxDoAI.js'
import config from '../../config/config.js'

/**
 * AI批量翻译适配器 - 用于处理大规模AI翻译服务
 */
export class AIBatchAdapter extends TranslationAdapter {
	constructor() {
		super()
		// this.translator = new DeepSeekAITranslator(config.apiKey[config.translateMethod])
		this.translator = new QianwenAITranslator(config.apiKey[config.translateMethod])
		console.log(`当前翻译模型：${this.translator.model}`)
	}

	/**
	 * 渲染翻译名称
	 * @returns {Promise<string>} 生成的唯一翻译名称
	 */
	renderTranslateName(index) {
		const timestamp = Date.now()
		return `t_${index}_${timestamp}`
	}

	/**
	 * 执行AI批量翻译 - 包含错误重试机制
	 * @param {string} text - 待翻译的文本内容
	 * @param {string[]} languages - 目标语言列表
	 * @param {number} maxRetries - 最大重试次数
	 * @param {number} index - 翻译名称索引
	 * @returns {Promise<{text: string, translations: Record<string, string}>} 翻译结果对象
	 * @throws {Error} 当所有重试都失败时抛出错误
	 */
	async translate(text, languages, maxRetries, index) {
		let lastError = null
		let retryCount = 0
		while (retryCount <= maxRetries) {
			try {
				const result = await this.translator.translate({
					text,
					languages,
				})
				const key = this.renderTranslateName(index)
				return {
					text,
					key,
					translations: result.translations,
				}
			} catch (error) {
				lastError = error
				retryCount++
				// 如果还有重试机会，等待一段时间后重试
				if (retryCount <= maxRetries) {
					await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
					continue
				}

				throw new Error(`AI批量翻译失败(已重试${retryCount}次) - ${lastError.message}`)
			}
		}
	}

	/**
	 * 获取AI翻译服务支持的语言列表
	 * @returns {string[]} 支持的语言代码列表
	 */
	getSupportedLanguages() {
		return this.translator.getSupportedLanguages()
	}

	/**
	 * 验证API密钥是否有效
	 * @param {string} apiKey - 待验证的API密钥
	 * @returns {Promise<boolean>} 密钥是否有效
	 */
	async validateApiKey(apiKey) {
		try {
		} catch {
			return false
		}
	}
}
