import axios from 'axios'
import CryptoJS from 'crypto-js'
import { Utils } from '../../utils/index.js'

export class QianwenAITranslator {
	constructor(apiKey) {
		this.apiKey = apiKey
		this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
		this.model = 'qwen-max'
	}

	/**
	 * 生成翻译提示词
	 * @param {string} text - 待翻译文本
	 * @param {string[]} languages - 目标语言列表
	 * @returns {string}
	 */
	generatePrompt(text, languages) {
		const targetLanguages = languages
			.map((code) => {
				const { language, region } = Utils.parseLanguageCode(code)
				return `${language}${region}`
			})
			.join(', ')

		return `你是专业的翻译，根据用户提供的翻译文本，生成不同的翻译结果，请将以下文本翻译成${targetLanguages}多种语言，\r\n
		如果翻译文本包含{riskNum}包裹的字符，保持{}和包裹的字符，以及翻译文本本身是英文的时候，直接跳过翻译，输出原文按当前格式返回即可，\r\n
		其他的内容继续翻译，返回JSON格式，注意要严格按照JSON格式返回，返回前先检查是否符合JSON格式,字符串内部不能有换行，输出格式示例：\n{
      "zhCN": "中文",
      "enUS": "English"
    }`
	}

	// 生成智谱AI API所需的JWT token
	async getToken() {
		const [id, secret] = this.apiKey.split('.')
		const header = { alg: 'HS256', sign_type: 'SIGN' }
		const payload = {
			api_key: id,
			exp: Math.floor(Date.now() / 1000) + 3600,
			timestamp: Math.floor(Date.now() / 1000),
		}
		const headerBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(header))).replace(
			/=/g,
			'',
		)
		const payloadBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(payload))).replace(
			/=/g,
			'',
		)

		const signature = CryptoJS.enc.Base64.stringify(
			CryptoJS.HmacSHA256(`${headerBase64}.${payloadBase64}`, secret),
		).replace(/=/g, '')
		return `${headerBase64}.${payloadBase64}.${signature}`
	}

	/**
	 * 调用智谱AI进行翻译
	 * @param {string} text - 待翻译文本
	 * @param {string[]} languages - 目标语言列表
	 * @returns {Promise<{text: string, translations: Object}>}
	 */
	async translate({ text, languages }) {
		try {
			const translations = {}
			// 判断当前翻译内容是否为纯英文，如果是，则直接返回原文
			if (/^[\x00-\x7F]*$/.test(text)) {
				for (const code of languages) {
					translations[code] = text
				}
			} else {
				const prompt = this.generatePrompt(text, languages)
				// const token = await this.getToken()

				const response = await axios({
					method: 'post',
					url: this.baseURL,
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						'Content-Type': 'application/json',
					},
					data: {
						model: this.model,
						messages: [
							{
								role: 'system',
								content: prompt,
							},
							{ role: 'user', content: `翻译文本：${text}` },
						],
					},
				})

				if (!response.data || !response.data.choices || !response.data.choices[0]) {
					throw new Error('无效的API响应')
				}

				// 解析智谱AI翻译结果
				const rawTranslations = this.parseTranslations(response.data.choices[0].message.content)

				// console.log(rawTranslations, text)
				// 转换语言代码格式
				for (const [code, value] of Object.entries(rawTranslations)) {
					translations[code] = value
				}
			}
			return {
				text,
				translations: Utils.formatTranslations(translations),
			}
		} catch (error) {
			throw new Error(`千问AI翻译失败: ${error.message}`)
		}
	}

	/**
	 * 解析智谱AI翻译结果，转换为标准格式
	 * @param {string} text - 待翻译文本
	 * @returns {Object} - 标准格式的翻译结果
	 */
	parseTranslations(text) {
		text = text.replace('```json\n', '').replace('```', '')
		return JSON.parse(text)
	}

	/**
	 * 检查API密钥是否有效
	 * @returns {Promise<boolean>}
	 */
	async validateApiKey() {
		try {
			await axios.get(`${this.baseURL}/validate`, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
				},
			})
			return true
		} catch {
			return false
		}
	}
}

export default QianwenAITranslator
