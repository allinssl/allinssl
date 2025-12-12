/**
 * 翻译适配器基类 - 用于统一不同翻译服务的接口实现
 */
export class TranslationAdapter {
	constructor() {
		if (this.constructor === TranslationAdapter) {
			throw new Error('翻译适配器：抽象类不能被直接实例化')
		}
	}

	/**
	 * 执行翻译 - 将给定文本翻译为目标语言
	 * @param {string} text - 待翻译的文本内容
	 * @param {string} apiKey - 翻译服务的API密钥
	 * @param {string[]} languages - 目标语言代码列表，如 ['enUS', 'jaJP']
	 * @param {number} maxRetries - 翻译失败时的最大重试次数
	 * @returns {Promise<{text: string, translations: Record<string, string}>} 翻译结果对象
	 * @throws {Error} 当翻译失败且超过重试次数时抛出错误
	 */
	async translate(text, apiKey, languages, maxRetries) {
		throw new Error('翻译适配器：translate 方法必须在子类中实现')
	}

	/**
	 * 获取当前适配器支持的语言列表
	 * @returns {string[]} 支持的语言代码列表
	 */
	getSupportedLanguages() {
		throw new Error('翻译适配器：getSupportedLanguages 方法必须在子类中实现')
	}

	/**
	 * 检查指定语言是否被当前适配器支持
	 * @param {string} language - 需要检查的语言代码
	 * @returns {boolean} 是否支持该语言
	 */
	isLanguageSupported(language) {
		return this.getSupportedLanguages().includes(language)
	}
}
