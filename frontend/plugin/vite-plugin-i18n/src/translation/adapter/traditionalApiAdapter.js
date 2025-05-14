import { TranslationAdapter } from './index.js'
import { translate as traditionalApiTranslate } from '../traditional/api1.js'

/**
 * 传统API翻译适配器 - 用于适配常规REST API类型的翻译服务
 */
export class TraditionalApiAdapter extends TranslationAdapter {
	constructor(apiModule) {
		super()
		if (!apiModule?.translate || typeof apiModule.translate !== 'function') {
			throw new Error('传统API适配器：无效的API模块，必须提供translate方法')
		}
		this.apiModule = apiModule
	}

	/**
	 * 执行翻译请求 - 将数据转换为传统API格式并处理响应
	 * @param {string} text - 待翻译的文本内容
	 * @param {string} apiKey - API密钥
	 * @param {string[]} languages - 目标语言列表
	 * @param {number} maxRetries - 最大重试次数
	 * @returns {Promise<{text: string, translations: Record<string, string>}>} 标准化的翻译结果
	 * @throws {Error} 当翻译失败或语言不支持时抛出错误
	 */
	async translate(text, apiKey, languages, maxRetries) {
		// 检查所有目标语言是否支持
		for (const lang of languages) {
			if (!this.isLanguageSupported(lang)) {
				throw new Error(`传统API适配器：不支持的目标语言 "${lang}"`)
			}
		}

		// 转换为API期望的请求格式
		const requestData = {
			text,
			apiKey,
			targetLanguages: languages,
			retryCount: maxRetries,
		}

		try {
			const result = await this.apiModule.translate(requestData)
			return {
				text,
				translations: result.translations,
			}
		} catch (error) {
			throw new Error(`传统API适配器：翻译失败 - ${error.message}`)
		}
	}

	/**
	 * 获取API支持的语言列表
	 * @returns {string[]} 支持的语言代码数组
	 */
	getSupportedLanguages() {
		return this.apiModule.getSupportedLanguages?.() || []
	}
}
