/**
 * 域名安全页面状态管理
 * 负责管理API密钥数据、筛选条件、分页等状态
 */

import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { createApi, getApiKeyList, updateApiKey as updateApiKeyApi, regenerateApiKey as regenerateApiKeyApi, deleteApiKey as deleteApiKeyApi } from '@/api/api'

import type { TableResponse } from '@baota/naive-ui/types/table'
import type { ApiKeyItem, ApiKeyListRequest, ApiKeyFormData, StatusOption } from './types.d'

const message = useMessage()
const { handleError } = useError()

/**
 * 域名安全页面状态Store
 */
export const useDomainSecurityStore = defineStore('domain-security-store', () => {
	// -------------------- 状态定义 --------------------

	/** 页面加载状态 */
	const loading = ref(false)

	/** 状态选项 */
	const statusOptions = ref<StatusOption[]>([
		{ label: '全部状态', value: '' },
		{ label: '启用', value: 1 },
		{ label: '禁用', value: 0 },
	])

	/** 筛选表单数据 */
	const filterFormData = ref<ApiKeyListRequest>({
		p: 1,
		rows: 10,
		keyword: '',
		status: '',
	})

	/** 表单数据（创建/编辑） */
	const formData = ref<ApiKeyFormData>({
		name: '',
		ip_whitelist: '',
		status: 1,
	})

	/** 编辑状态 */
	const isEditing = ref(false)
	const editingId = ref<number | null>(null)

	// -------------------- 方法定义 --------------------

	/**
	 * 获取API密钥列表数据
	 */
	const fetchApiKeyListData = async <T = ApiKeyItem>(
		params: ApiKeyListRequest = {}
	): Promise<TableResponse<T>> => {
		try {
			loading.value = true
			const requestParams = { ...params }
			if (requestParams.status === '' || requestParams.status === undefined) {
				delete requestParams.status
			}
			const { fetch, data } = getApiKeyList(requestParams)
			await fetch()
			if (data.value?.status) {
				const responseData = data.value?.data
				return {
					list: responseData.data as T[],
					total: responseData.total,
				}
			}
		} catch (error) {
			handleError(error)
		} finally {
			loading.value = false
		}
		return { list: [] as T[], total: 0 }
	}

	/**
	 * 重置表单数据
	 */
	const resetFormData = () => {
		formData.value = {
			name: '',
			ip_whitelist: '',
			status: 1,
		}
		isEditing.value = false
		editingId.value = null
	}

	/**
	 * 设置编辑数据
	 */
	const setEditingData = (item: ApiKeyItem) => {
		isEditing.value = true
		editingId.value = item.id
		formData.value = {
			name: item.name,
			ip_whitelist: item.ip_whitelist?.join('\n') || '',
			status: item.status,
		}
	}

	/**
	 * 创建API密钥
	 */
	const createApiKey = async (data: ApiKeyFormData): Promise<{ success: boolean; keyInfo?: { access_key: string; account_id: string; secret_key: string } }> => {
		try {
			loading.value = true
			const ipWhitelist = data.ip_whitelist 
				? data.ip_whitelist.trim().split(/\n/).map(ip => ip.trim()).filter(ip => ip.length > 0)
				: []
			
			const createParams = {
				name: data.name,
				ip_whitelist: ipWhitelist
			}
			
			const { fetch, data: apiResponse, message } = createApi(createParams)
			message.value = true
			await fetch()
			if (apiResponse.value?.status) {
				const responseData = apiResponse.value?.data
				return {
					success: true,
					keyInfo: responseData ? {
						access_key: responseData.access_key,
						account_id: responseData.account_id,
						secret_key: responseData.secret_key
					} : undefined
				}
			} 
		} catch (error) {
			handleError(error)
		} finally {
			loading.value = false
		}
		return { success: false }
	}

	/**
	 * 更新API密钥
	 */
	const updateApiKey = async (id: number, data: ApiKeyFormData): Promise<void> => {
		try {
			const ipWhitelist = data.ip_whitelist 
				? data.ip_whitelist.trim().split(/\n/).map(ip => ip.trim()).filter(ip => ip.length > 0)
				: []
			const updateParams = {
				config_id: id,
				name: data.name,
				status: data.status,
				ip_whitelist: ipWhitelist
			}
			const { fetch, message } = updateApiKeyApi(updateParams)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * 切换API密钥状态
	 */
	const toggleApiKeyStatus = async (config_id: number, status: number): Promise<void> => {
		try {
		const { fetch, message } = updateApiKeyApi({ 
			config_id, 
			status 
		} as any)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * 重新生成API密钥
	 */
	const regenerateApiKeyAction = async (config_id: number): Promise<{ success: boolean; keyInfo?: { access_key: string; account_id: string; secret_key: string } }> => {
		try {
			const { fetch, data, message } = regenerateApiKeyApi({ config_id })
			message.value = true
			await fetch()
			if (data.value?.status) {
				const responseData = data.value?.data
				return {
					success: true,
					keyInfo: responseData ? {
						access_key: responseData.access_key,
						account_id: responseData.account_id,
						secret_key: responseData.secret_key
					} : undefined
				}
			}
		} catch (error) {
			handleError(error)
		}
		
		return { success: false }
	}

	/**
	 * 删除API密钥
	 */
	const deleteApiKey = async (config_id: number): Promise<void> => {
		try {
			loading.value = true
			const { fetch, message } = deleteApiKeyApi({ config_id })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error)
		} finally {
			loading.value = false
		}
	}

	// 返回状态和方法
	return {
		// 状态
		loading,
		statusOptions,
		filterFormData,
		formData,
		isEditing,
		editingId,

		// 方法
		fetchApiKeyListData,
		resetFormData,
		setEditingData,
		createApiKey,
		updateApiKey,
		toggleApiKeyStatus,
		regenerateApiKey: regenerateApiKeyAction,
		deleteApiKey,
	}
})

/**
 * 导出Store实例
 */
export const useDomainSecurityState = () => {
	const store = useDomainSecurityStore()
	const storeRefs = storeToRefs(store)
	return {
		// 响应式状态
		...storeRefs,
		// 方法
		fetchApiKeyListData: store.fetchApiKeyListData,
		resetFormData: store.resetFormData,
		setEditingData: store.setEditingData,
		createApiKey: store.createApiKey,
		updateApiKey: store.updateApiKey,
		toggleApiKeyStatus: store.toggleApiKeyStatus,
		regenerateApiKey: store.regenerateApiKey,
		deleteApiKey: store.deleteApiKey,
	}
}
