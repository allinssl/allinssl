/**
 * @description 成功模板
 * @param {string} msg 消息
 * @returns
 */
export const listTemplate = <T>(data: T, count: number) => ({
	code: 200, // 状态码
	count, // 总数，仅data 为数组时有效
	data, // 数据
	message: '', // 消息
	status: true, // 消息状态，true 为成功，false 为失败
})

/**
 * @description 消息模板
 * @param {object} data 数据
 * @returns
 */
export const messageTemplate = (message: string, status: boolean) => ({
	code: 200, // 状态码
	count: 0, // 总数，仅data 为数组时有效
	message, // 消息
	status, // 消息状态，true 为成功，false 为失败
})
