/**
 * @description 移除输入框中的空格
 * @param {string} value 输入框的值
 * @returns {boolean} 是否为空
 */
export const noSideSpace = (value: string) => {
	return !value.startsWith(' ') && !value.endsWith(' ')
}

/**
 * @description 数字验证
 * @param {string} value 输入框的值
 * @returns {boolean} 是否为数字
 */
export const onlyAllowNumber = (value: string) => {
	return !value || /^\d+$/.test(value)
}



