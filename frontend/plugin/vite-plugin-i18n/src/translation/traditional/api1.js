import axios from 'axios'

export class TraditionalApi1 {
	constructor() {
		this.baseURL = 'https://api.example.com/translate'
		this.supportedLanguages = ['zhCN', 'zhTW', 'enUS', 'jaJP', 'koKR']
	}

	/**
	 * 执行翻译
	 * @param {Object} requestData - 请求数据
	 * @returns {Promise<{translations: Object}>}
	 */
	async translate(requestData) {
		const { text, apiKey, languages } = requestData

		try {
			const response = await axios.post(
				this.baseURL,
				{
					q: text,
					target: languages.map((lang) => this.formatLanguageCode(lang)),
				},
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
				},
			)

			if (!response.data || !response.data.translations) {
				throw new Error('无效的API响应')
			}

			// 转换响应格式
			const translations = {}
			response.data.translations.forEach((translation, index) => {
				translations[languages[index]] = translation.text
			})

			return { translations }
		} catch (error) {
			throw new Error(`API请求失败: ${error.message}`)
		}
	}

	/**
	 * 验证API密钥
	 * @param {string} apiKey - API密钥
	 * @returns {Promise<boolean>}
	 */
	async validateApiKey(apiKey) {
		try {
			await axios.get(`${this.baseURL}/validate`, {
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			})
			return true
		} catch {
			return false
		}
	}

	/**
	 * 获取支持的语言列表
	 * @returns {string[]}
	 */
	getSupportedLanguages() {
		return this.supportedLanguages
	}

	/**
	 * 格式化语言代码
	 * @param {string} code - 语言代码
	 * @returns {string}
	 */
	formatLanguageCode(code) {
		return `${code.slice(0, 2).toLowerCase()}-${code.slice(2).toUpperCase()}`
	}
}

export const api1 = new TraditionalApi1()
export default api1
