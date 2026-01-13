/**
 * 文件定义：字符串处理
 */

import * as R from 'ramda'

/* -------------- 1、字符串处理 -------------- */

/**
 * url字符串转换为对象
 * @param {string} url - 要转换的url字符串
 * @returns {Record<string, string>} 转换后的对象
 */
export const urlToObject = (url: string): Record<string, string> => {
	const urlObj = new URL(url)
	return Object.fromEntries(urlObj.searchParams.entries())
}

/**
 * 柯里化版本的urlToObject
 * @param {string} url - 要转换的url字符串
 * @returns {Record<string, string>} 转换后的对象
 */
export const urlToObjectCurried: {
	(url: string): Record<string, string>
	(url: string): (url: string) => Record<string, string>
} = R.curry(urlToObject)

/**
 * html转义，支持反转义
 * @param {string} str - 要转义的html字符串
 * @param {boolean} isReverse - 是否反转义
 * @returns {string} 转义后的html字符串
 */
export const htmlEscape = (str: string, isReverse: boolean = false): string => {
	const escapeMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
	}
	// 将escapeMap组合成正则表达式（反转义，将转义后的字符串转换为原始字符串）
	const repReg = isReverse ? R.invertObj(escapeMap) : R.map(R.identity, escapeMap)
	// 将repReg组合成正则表达式
	const repRegStr = Object.keys(repReg).join('|')
	// 使用正则表达式替换
	return str.replace(new RegExp(repRegStr, 'g'), (match: string) => {
		return repReg[match as keyof typeof repReg]
	})
}

/**
 * 小驼峰转下划线
 * @param {string} str - 要转换的驼峰字符串
 * @returns {string} 转换后的下划线字符串
 */
export const camelToUnderline = (str: string): string => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

/**
 * 下划线转小驼峰
 * @param {string} str - 要转换的下划线字符串
 * @returns {string} 转换后的驼峰字符串
 */
export const underlineToCamel = (str: string): string => {
	return str.replace(/_([a-z])/g, (_, char: string) => {
		return char.toUpperCase()
	})
}

/**
 * 下划线转大驼峰
 * @param {string} str - 要转换的下划线字符串
 * @returns {string} 转换后的驼峰字符串
 */
export const underlineToBigCamel = (str: string): string => {
	return str.replace(/_([a-z])/g, (_, char: string) => {
		return char.toUpperCase()
	})
}

/**
 * 大驼峰转下划线
 * @param {string} str - 要转换的驼峰字符串
 * @returns {string} 转换后的下划线字符串
 */
export const bigCamelToUnderline = (str: string): string => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

/**
 * @description 驼峰转短横线
 * @param {string} str - 要转换的驼峰字符串
 * @returns {string} 转换后的短横线字符串
 */
export const kebabCase = (str: string): string => {
	return bigCamelToSmallCamel(str)
		.replace(/([A-Z])/g, '-$1')
		.toLowerCase()
}

/**
 * @description 大驼峰转小驼峰
 * @param {string} str - 要转换的短横线字符串
 * @returns {string} 转换后的驼峰字符串
 */
export const bigCamelToSmallCamel = (str: string): string => {
	return str.replace(/^([A-Z])/, (_, char: string) => {
		return char.toLowerCase()
	})
}


