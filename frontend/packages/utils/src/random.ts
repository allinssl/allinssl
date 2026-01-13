/**
 * 文件定义：随机数生成
 */

import * as R from 'ramda'

/* -------------- 1、随机数生成 -------------- */

/**
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
export const randomInt = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成指定长度的随机字符串（默认32位，包括大小写字母和数字，去除0oO1Ii）
 * @param {number} length - 字符串长度
 * @param {object} options - 选项
 * @param {boolean} options.isSpecial - 是否包含特殊字符 (默认不包含)
 * @param {boolean} options.isLower - 是否包含小写字母（默认包含）
 * @param {boolean} options.isUpper - 是否包含大写字母（默认包含）
 * @param {boolean} options.isNumber - 是否包含数字（默认包含）
 * @returns {string} 随机字符串
 */
export const randomChart = (
	length: number = 32,
	options: { isSpecial?: boolean; isLower?: boolean; isUpper?: boolean; isNumber?: boolean } = {},
): string => {
	const { isSpecial = false, isLower = true, isUpper = true, isNumber = true } = options
	let chars = ''
	if (isSpecial) chars += '!@#$%^&*?'
	if (isLower) chars += 'abcdefghijklmnopqrstuvwxyz'
	if (isUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	if (isNumber) chars += '0123456789'
	const result = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
	console.log('result', result)
	return result
}

/**
 * 生成随机字符串，进阶版，支持包含字符最小长度，
 * @param {number} length - 字符串长度
 * @param {object} options - 选项
 * @param {number} options.minUpper - 大写字母最小长度（默认0）
 * @param {number} options.minLower - 小写字母最小长度（默认0）
 * @param {number} options.minNumber - 数字最小长度（默认0）
 * @param {number} options.minSpecial - 特殊字符最小长度（默认0）
 */
export const randomChartWithMinLength = (
	length: number = 32,
	options: { minUpper?: number; minLower?: number; minNumber?: number; minSpecial?: number } = {},
): string => {
	const { minUpper = 1, minLower = 1, minNumber = 1, minSpecial = 0 } = options // 解构赋值，默认值为0
	let result = ''
	const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const lowerChars = 'abcdefghijklmnopqrstuvwxyz'
	const numberChars = '0123456789'
	const specialChars = '!@#$%^&*?'

	// 计算已确定的最小字符数
	const minTotal = minUpper + minLower + minNumber + minSpecial
	if (minTotal > length) {
		throw new Error('最小长度要求总和超过了指定的总长度')
	}

	// 生成必需的字符
	const getRandomChars = (chars: string, count: number): string => {
		return Array.from({ length: count }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
	}

	// 添加必需的字符
	if (minUpper > 0) result += getRandomChars(upperChars, minUpper)
	if (minLower > 0) result += getRandomChars(lowerChars, minLower)
	if (minNumber > 0) result += getRandomChars(numberChars, minNumber)
	if (minSpecial > 0) result += getRandomChars(specialChars, minSpecial)

	// 计算剩余需要填充的长度
	const remainingLength = length - minTotal

	// 创建可用字符集合
	let availableChars = ''
	if (minUpper >= 0) availableChars += upperChars
	if (minLower >= 0) availableChars += lowerChars
	if (minNumber >= 0) availableChars += numberChars
	if (minSpecial >= 0) availableChars += specialChars

	// 填充剩余长度
	result += getRandomChars(availableChars, remainingLength)

	// 打乱最终结果
	return result
		.split('')
		.sort(() => Math.random() - 0.5)
		.join('')
}
