import _ from 'lodash'

/**
 * 工具函数集合
 */
export class Utils {
	/**
	 * 将数组分块
	 * @param {Array} array - 待分块的数组
	 * @param {number} size - 块大小
	 * @returns {Array[]} - 分块后的数组
	 */
	static chunkArray(array, size) {
		return _.chunk(array, size)
	}

	/**
	 * 延迟执行
	 * @param {number} ms - 延迟时间（毫秒）
	 * @returns {Promise<void>}
	 */
	static delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	/**
	 * 检查是否为中文字符
	 * @param {string} text - 待检查的文本
	 * @returns {boolean}
	 */
	static isChineseText(text) {
		return /[\u4e00-\u9fa5]/.test(text)
	}

	/**
	 * 从文本中提取中文内容
	 * @param {string} content - 文件内容
	 * @param {RegExp} templateRegex - 模板变量正则表达式
	 * @returns {Set<string>} - 中文内容集合
	 */
	static extractChineseTexts(content, templateRegex) {
		const texts = new Set()
		let match
		while ((match = templateRegex.exec(content)) !== null) {
			if (this.isChineseText(match[1])) {
				texts.add(match[1])
			}
		}
		return texts
	}

	/**
	 * 格式化翻译结果
	 * @param {Object} translations - 翻译结果
	 * @returns {Object} - 格式化后的翻译结果
	 */
	static formatTranslations(translations) {
		const formatted = {}
		for (const [key, value] of Object.entries(translations)) {
			formatted[key] = typeof value === 'string' ? value.trim() : value
		}
		return formatted
	}

	/**
	 * 生成翻译键名
	 * @param {string} text - 原始中文文本
	 * @param {string} namespace - 命名空间，通常是文件路径
	 * @returns {string} - 生成的键名
	 */
	static renderTranslateName() {
		const time = Date.now()
		return `t_${time}`
	}

	/**
	 * 简单的哈希函数，用于为文本生成唯一标识
	 * @param {string} str - 输入字符串
	 * @returns {string} - 哈希值（十六进制）
	 */
	static simpleHash(str) {
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // 转换为32位整数
		}
		return Math.abs(hash).toString(16).substring(0, 6)
	}

	/**
	 * 获取相对于项目源代码目录的路径
	 * @param {string} filePath - 完整文件路径
	 * @param {string} projectPath - 项目源代码根目录
	 * @returns {string} - 相对路径，用作命名空间
	 */
	static getNamespace(filePath, projectPath) {
		// 移除项目路径前缀并转换为点分隔的路径
		const relativePath = filePath.replace(projectPath, '').replace(/^\/+/, '')
		// 移除文件扩展名，并将目录分隔符转为点
		return relativePath
			.replace(/\.[^/.]+$/, '')
			.split('/')
			.join('.')
	}

	/**
	 * 合并翻译结果
	 * @param {Object} target - 目标对象
	 * @param {Object} source - 源对象
	 * @returns {Object} - 合并后的对象
	 */
	static mergeTranslations(target, source) {
		return _.mergeWith(target, source, (objValue, srcValue) => {
			if (_.isString(objValue) && _.isString(srcValue)) {
				return srcValue // 使用新的翻译结果
			}
		})
	}

	/**
	 * 验证语言代码
	 * @param {string} code - 语言代码
	 * @returns {boolean}
	 */
	static isValidLanguageCode(code) {
		const languageCodePattern = /^[a-z]{2}[A-Z]{2}$/
		return languageCodePattern.test(code)
	}

	/**
	 * 验证配置对象
	 * @param {Object} config - 配置对象
	 * @returns {string[]} - 错误信息数组
	 */
	static validateConfig(config) {
		const errors = []

		if (!config.apiKey || typeof config.apiKey !== 'object') {
			errors.push('apiKey 必须是一个对象')
		}

		if (config.languages && Array.isArray(config.languages)) {
			const invalidCodes = config.languages.filter((code) => !this.isValidLanguageCode(code))
			if (invalidCodes.length > 0) {
				errors.push(`无效的语言代码: ${invalidCodes.join(', ')}`)
			}
		} else {
			errors.push('languages 必须是一个数组')
		}

		if (typeof config.concurrency !== 'number' || config.concurrency <= 0) {
			errors.push('concurrency 必须是一个正数')
		}

		if (typeof config.interval !== 'number' || config.interval < 0) {
			errors.push('interval 必须是一个非负数')
		}

		return errors
	}

	/**
	 * 生成唯一标识符
	 * @returns {string}
	 */
	static generateId() {
		return _.uniqueId('translation_')
	}

	/**
	 * 格式化错误信息
	 * @param {Error} error - 错误对象
	 * @returns {Object}
	 */
	static formatError(error) {
		return {
			message: error.message,
			stack: error.stack,
			timestamp: new Date().toISOString(),
		}
	}

	/**
	 * 解析语言代码
	 * @param {string} code - 语言代码
	 * @returns {Object}
	 */
	static parseLanguageCode(code) {
		const language = code.slice(0, 2).toLowerCase()
		const region = code.slice(2).toUpperCase()
		return { language, region }
	}
}

export default Utils
