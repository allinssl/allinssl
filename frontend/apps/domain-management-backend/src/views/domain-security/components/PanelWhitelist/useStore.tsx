/**
 * IP白名单组件状态管理
 * 负责管理IP白名单数据、筛选条件、分页等状态
 */

import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { setPanelWhitelist, getPanelWhitelist, togglePanelWhitelist, deletePanelWhitelist } from '@/api/security'

import type { TableResponse } from '@baota/naive-ui/types/table'
import type { PanelWhitelistListRequest, PanelWhitelistItem, PanelWhitelistFormData, PanelWhitelistFormInputData, PanelWhitelistToggleRequest, PanelWhitelistDeleteRequest } from '../../types.d'

const message = useMessage()
const { handleError } = useError()

/**
 * IP白名单组件状态Store
 */
export const usePanelWhitelistStore = defineStore('panel-whitelist-store', () => {
	// -------------------- 状态定义 --------------------

	/** 页面加载状态 */
	const loading = ref(false)

	/** 筛选表单数据 */
	const filterFormData = ref<PanelWhitelistListRequest>({
		p: 1,
		rows: 10,
	})


	/** 表单数据（创建/编辑） */
	const formData = ref<PanelWhitelistFormInputData>({
		name: '',
		whitelist_ips: '',
		is_enabled: true,
		remark: '',
	})

	/** 编辑状态 */
	const isEditing = ref(false) // 如果后续不迭代，可以将编辑相关的逻辑删除
	const editingId = ref<number | null>(null)

	// -------------------- 方法定义 --------------------

	/**
	 * 获取IP白名单列表数据
	 */
	const fetchPanelWhitelistListData = async <T = PanelWhitelistItem>(
		params: PanelWhitelistListRequest = {}
	): Promise<TableResponse<T>> => {
		try {
			loading.value = true
			const requestParams = { ...params }
			
			const { fetch, data } = getPanelWhitelist(requestParams)
			await fetch()
			if (data.value?.status) {
				const responseData = data.value?.data
				return {
					list: responseData.list as T[],
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
			whitelist_ips: '',
			is_enabled: true,
			remark: '',
		}
		isEditing.value = false
		editingId.value = null
	}

	/**
	 * 设置编辑数据
	 */
	const setEditingData = (item: PanelWhitelistItem) => {
		isEditing.value = true
		editingId.value = item.id
		formData.value = {
			name: item.name,
			whitelist_ips: item.whitelist_ips?.join('\n') || '',
			is_enabled: item.is_enabled,
			remark: item.remark || '',
		}
	}

	/**
	 * 创建IP白名单
	 */
	const createPanelWhitelist = async (data: PanelWhitelistFormData): Promise<{ success: boolean }> => {
		try {
			loading.value = true
			
			const { fetch, data: responseData, message } = setPanelWhitelist(data)
			message.value = true
			await fetch()
			
			// 检查 API 响应的 status 字段
			if (responseData.value?.status) {
				return { success: true }
			} else {
				return { success: false }
			}
		} catch (error) {
			handleError(error)
		} finally {
			loading.value = false
		}
		return { success: false }
	}

	/**
	 * 切换IP白名单启用状态
	 */
	const togglePanelWhitelistStatus = async (data: PanelWhitelistToggleRequest | PanelWhitelistItem, isEnabled?: boolean): Promise<{ success: boolean }> => {
		try {
			loading.value = true
			
			let toggleData: PanelWhitelistToggleRequest
			
			if ('whitelist_ips' in data && Array.isArray(data.whitelist_ips)) {
				toggleData = {
					id: data.id,
					name: data.name,
					whitelist_ips: data.whitelist_ips,
					is_enabled: isEnabled !== undefined ? isEnabled : data.is_enabled,
					remark: data.remark || ''
				}
			} else {
				// 如果是 PanelWhitelistToggleRequest，直接使用
				toggleData = data as PanelWhitelistToggleRequest
			}
			
			const { fetch, data: responseData, message } = togglePanelWhitelist(toggleData)
			message.value = true
			await fetch()
			
			// 检查 API 响应的 status 字段
			if (responseData.value?.status) {
				return { success: true }
			} else {
				return { success: false }
			}
		} catch (error) {
			handleError(error)
		} finally {
			loading.value = false
		}
		return { success: false }
	}

	/**
	 * 删除IP白名单
	 */
	const deletePanelWhitelistItem = async (id: number): Promise<{ success: boolean }> => {
		try {
			loading.value = true
			
			const { fetch, data: responseData, message } = deletePanelWhitelist({ id })
			message.value = true
			await fetch()
			
			if (responseData.value?.status) {
				return { success: true }
			} else {
				return { success: false }
			}
		} catch (error) {
			handleError(error)
		} finally {
			loading.value = false
		}
		return { success: false }
	}



	// 返回状态和方法
	return {
		// 状态
		loading,
		filterFormData,
		formData,
		isEditing,
		editingId,

		// 方法
		fetchPanelWhitelistListData,
		resetFormData,
		setEditingData,
		createPanelWhitelist,
		togglePanelWhitelistStatus,
		deletePanelWhitelistItem,
	}
})

/**
 * 导出Store实例
 */
export const usePanelWhitelistState = () => {
	const store = usePanelWhitelistStore()
	const storeRefs = storeToRefs(store)
	return {
		// 响应式状态
		...storeRefs,
		// 方法
		fetchPanelWhitelistListData: store.fetchPanelWhitelistListData,
		resetFormData: store.resetFormData,
		setEditingData: store.setEditingData,
		createPanelWhitelist: store.createPanelWhitelist,
		togglePanelWhitelistStatus: store.togglePanelWhitelistStatus,
		deletePanelWhitelistItem: store.deletePanelWhitelistItem,
	}
}
