import { AxiosResponse } from 'axios'
import { responseMiddleware } from './other'
import { isObject, isString } from '@baota/utils/type'
import { hasRequiredKeys } from '@baota/utils/data'

/*
 * 预处理响应数据中间件，该组件运行在
 */
export const processPanelDataMiddle = responseMiddleware((response: AxiosResponse) => {
	const defaultOption = {
		data: {}, // 请求数据
		code: 0, // 状态码，200为成功，其他为失败
		msg: 'success', // 提示信息
		status: true, // 接口状态
		default: true, // 默认状态，用于判断当前数据是否为默认数据，没有经过处理
		cache: false, // 是否缓存，基于前端缓存
		oldData: null, // 旧数据，用于保存原始shuj
		timestamp: 0, // 时间戳
	}
	const { data } = response
	const { custom } = response.config
	const result = { ...defaultOption } // 拷贝一份数据
	// 监测字段是否存在
	if (isObject(data)) {
		const hasRequiredKeysCurry = hasRequiredKeys(data)
		const hasStatus = hasRequiredKeysCurry(['status']) // 是否存在status字段
		const hasMsg = hasRequiredKeysCurry(['msg']) // 是否存在msg字段
		const hasData = hasRequiredKeysCurry(['data']) // 是否存在data字段
		if (hasStatus) result.status = (data as { status: boolean }).status
		if (hasMsg) result.msg = (data as { msg: string }).msg
		if (hasData) result.data = (data as { data: any }).data
		result.default = false
	} else {
		result.data = data
		result.default = true // 原数据，仅移动至data
	}
	result.oldData = data
	if (isString(data)) return response
	return response
})
