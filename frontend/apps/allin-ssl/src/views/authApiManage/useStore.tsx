import { getAccessList, addAccess, updateAccess, deleteAccess } from '@api/access'
import { useError } from '@baota/hooks/error'
import { useMessage } from '@baota/naive-ui/hooks'
import { $t } from '@locales/index'

import type { AccessItem, AccessListParams, AddAccessParams, UpdateAccessParams } from '@/types/access'
import type { TableResponse } from '@baota/naive-ui/types/table'

const { handleError } = useError() // 导入错误处理钩子
const message = useMessage() // 导入消息钩子

/**
 * 授权API管理状态 Store
 * @description 用于管理授权API相关的状态和操作，包括API列表、类型、分页等
 */
export const useAuthApiManageStore = defineStore('auth-api-manage-store', () => {
	// -------------------- 状态定义 --------------------

	/** 添加/编辑API表单 */
	const apiFormProps = ref({
		name: '',
		type: 'btpanel',
		config: {
			url: '',
			api_key: '',
			ignore_ssl: '0',
		},
	})

	// 表格列配置
	const accessTypeMap = {
		dns: $t('t_3_1745735765112'),
		host: $t('t_0_1746754500246'),
	}

	// -------------------- 请求方法 --------------------
	/**
	 * 获取授权API列表
	 * @description 根据分页和关键词获取授权API列表数据
	 * @param {Object} params - 查询参数
	 * @returns {Promise<TableResponse<T>>} 返回列表数据和总数
	 */
	const fetchAccessList = async <T = AccessItem,>(params: AccessListParams): Promise<TableResponse<T>> => {
		try {
			const res = await getAccessList(params).fetch()
			return {
				list: (res.data || []) as T[],
				total: res.count,
			}
		} catch (error) {
			handleError(error)
			return { list: [] as T[], total: 0 }
		}
	}

	/**
	 * 新增授权API
	 * @description 创建新的授权API配置
	 * @param {AddAccessParams} params - 授权API参数
	 * @returns {Promise<{status: boolean, message: string}>} 操作结果
	 */
	const addNewAccess = async (params: AddAccessParams<string>) => {
		try {
			const { fetch, message } = addAccess(params)
			message.value = true
			await fetch()
			resetApiForm()
		} catch (error) {
			if (handleError(error)) message.error($t('t_8_1745289354902'))
		}
	}

	/**
	 * 更新授权API
	 * @description 更新指定的授权API配置信息
	 * @param {UpdateAccessParams} params - 授权API更新参数
	 * @returns {Promise<{status: boolean, message: string}>} 操作结果
	 */
	const updateExistingAccess = async (params: UpdateAccessParams<string>) => {
		try {
			const { fetch, message } = updateAccess(params)
			message.value = true
			await fetch()
			resetApiForm()
		} catch (error) {
			if (handleError(error)) message.error($t('t_40_1745227838872'))
		}
	}

	/**
	 * 删除授权API
	 * @description 删除指定的授权API配置
	 * @param {number} id - 授权API ID
	 * @returns {Promise<{status: boolean, message: string}>} 操作结果
	 */
	const deleteExistingAccess = async (id: string) => {
		try {
			const { fetch, message } = deleteAccess({ id })
			message.value = true
			await fetch()
			resetApiForm()
		} catch (error) {
			if (handleError(error)) message.error($t('t_40_1745227838872'))
		}
	}

	/**
	 * 重置API表单
	 * @description 重置表单数据为初始状态
	 */
	const resetApiForm = () => {
		apiFormProps.value = {
			name: '',
			type: 'btpanel',
			config: {
				url: '',
				api_key: '',
				ignore_ssl: '0',
			},
		}
	}

	return {
		// 状态
		apiFormProps,
		accessTypeMap,

		// 方法
		fetchAccessList,
		addNewAccess,
		updateExistingAccess,
		deleteExistingAccess,
		resetApiForm,
	}
})

/**
 * 组合式 API 使用 Store
 * @description 提供对授权API管理 Store 的访问，并返回响应式引用
 * @returns {Object} 包含所有 store 状态和方法的对象
 */
export const useStore = () => {
	const store = useAuthApiManageStore()
	return { ...store, ...storeToRefs(store) }
}
