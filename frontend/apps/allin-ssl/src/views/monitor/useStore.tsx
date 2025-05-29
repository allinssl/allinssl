import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { getSiteMonitorList, addSiteMonitor, updateSiteMonitor, deleteSiteMonitor, setSiteMonitor } from '@/api/monitor'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'

import type { Ref } from 'vue'
import type {
	SiteMonitorItem,
	SiteMonitorListParams,
	AddSiteMonitorParams,
	UpdateSiteMonitorParams,
	SetSiteMonitorParams,
	DeleteSiteMonitorParams,
} from '@/types/monitor'
import type { TableResponse } from '@baota/naive-ui/types/table'

// 导入错误处理钩子
const { handleError } = useError()
const message = useMessage()

/**
 * 定义Store暴露的类型
 */
interface MonitorStoreExposes {
	// 状态
	monitorForm: Ref<AddSiteMonitorParams & UpdateSiteMonitorParams>

	// 方法
	fetchMonitorList: <T = SiteMonitorItem>(params: SiteMonitorListParams) => Promise<TableResponse<T>>
	addNewMonitor: (params: AddSiteMonitorParams) => Promise<boolean>
	updateExistingMonitor: (params: UpdateSiteMonitorParams) => Promise<boolean>
	deleteExistingMonitor: (params: DeleteSiteMonitorParams) => Promise<boolean>
	setMonitorStatus: (params: SetSiteMonitorParams) => Promise<boolean>
	resetMonitorForm: () => void
	updateMonitorForm: (params?: UpdateSiteMonitorParams | null) => void
	submitForm: () => Promise<boolean>
}

/**
 * 监控管理状态 Store
 * @description 用于管理监控相关的状态和操作，包括监控列表、添加、编辑等
 */
export const useMonitorStore = defineStore('monitor-store', (): MonitorStoreExposes => {
	// -------------------- 状态定义 --------------------

	/**
	 * 添加/编辑监控表单状态
	 */
	const monitorForm = ref<AddSiteMonitorParams & UpdateSiteMonitorParams>({
		id: 0,
		name: '',
		domain: '',
		cycle: 1,
		report_type: '',
	})

	// -------------------- 方法定义 --------------------
	/**
	 * 获取监控列表
	 * @description 根据分页参数获取监控列表数据
	 * @param {SiteMonitorListParams} params - 查询参数
	 * @returns {Promise<TableResponse<T>>} 返回列表数据和总数
	 */
	const fetchMonitorList = async <T = SiteMonitorItem,>(params: SiteMonitorListParams): Promise<TableResponse<T>> => {
		try {
			const { data, count } = await getSiteMonitorList(params).fetch()
			return {
				list: (data || []) as T[],
				total: count,
			}
		} catch (error) {
			handleError(error)
			return { list: [] as T[], total: 0 }
		}
	}

	/**
	 * 添加监控
	 * @description 添加新监控
	 * @param {AddSiteMonitorParams} params - 添加监控参数
	 * @returns {Promise<boolean>} 是否添加成功
	 */
	const addNewMonitor = async (params: AddSiteMonitorParams): Promise<boolean> => {
		try {
			const { fetch, message } = addSiteMonitor(params)
			message.value = true
			await fetch()
			return true
		} catch (error) {
			if (handleError(error)) message.error($t('t_7_1745289355714'))
			return false
		}
	}

	/**
	 * 更新监控
	 * @description 更新指定ID的监控
	 * @param {UpdateSiteMonitorParams} params - 更新监控参数
	 * @returns {Promise<boolean>} 是否更新成功
	 */
	const updateExistingMonitor = async (params: UpdateSiteMonitorParams): Promise<boolean> => {
		try {
			const { fetch, message } = updateSiteMonitor(params)
			message.value = true
			await fetch()
			return true
		} catch (error) {
			if (handleError(error)) message.error($t('t_23_1745289355716'))
			return false
		}
	}

	/**
	 * 删除监控
	 * @description 删除指定ID的监控
	 * @param {DeleteSiteMonitorParams} params - 删除监控参数
	 * @returns {Promise<boolean>} 是否删除成功
	 */
	const deleteExistingMonitor = async (params: DeleteSiteMonitorParams): Promise<boolean> => {
		try {
			const { fetch, message } = deleteSiteMonitor(params)
			message.value = true
			await fetch()
			return true
		} catch (error) {
			if (handleError(error)) message.error($t('t_40_1745227838872'))
			return false
		}
	}

	/**
	 * 设置监控状态
	 * @description 设置指定ID的监控状态
	 * @param {SetSiteMonitorParams} params - 设置监控状态参数
	 * @returns {Promise<boolean>} 是否设置成功
	 */
	const setMonitorStatus = async (params: SetSiteMonitorParams): Promise<boolean> => {
		try {
			const { fetch, message } = setSiteMonitor(params)
			message.value = true
			await fetch()
			return true
		} catch (error) {
			if (handleError(error)) message.error($t('t_24_1745289355715'))
			return false
		}
	}

	/**
	 * 更新监控表单
	 * @description 用于编辑时填充表单数据
	 * @param {UpdateSiteMonitorParams | null} params - 更新监控参数
	 */
	const updateMonitorForm = (params: UpdateSiteMonitorParams | null = monitorForm.value): void => {
		const { id, name, domain, cycle, report_type } = params || monitorForm.value
		monitorForm.value = { id, name, domain, cycle, report_type }
	}

	/**
	 * 重置表单
	 * @description 清空表单数据
	 */
	const resetMonitorForm = (): void => {
		monitorForm.value = {
			id: 0,
			name: '',
			domain: '',
			cycle: 1,
			report_type: '',
		}
	}

	/**
	 * 提交表单
	 * @description 根据表单状态自动判断是添加还是更新操作
	 * @returns {Promise<boolean>} 是否提交成功
	 */
	const submitForm = async (): Promise<boolean> => {
		const { id, ...params } = monitorForm.value
		if (id) {
			return updateExistingMonitor({ id, ...params }) // 编辑模式
		} else {
			return addNewMonitor(params) // 添加模式
		}
	}

	// 返回所有状态和方法
	return {
		monitorForm,
		fetchMonitorList,
		addNewMonitor,
		updateExistingMonitor,
		deleteExistingMonitor,
		setMonitorStatus,
		resetMonitorForm,
		updateMonitorForm,
		submitForm,
	}
})

/**
 * 组合式 API 使用 Store
 * @description 提供对监控管理 Store 的访问，并返回响应式引用
 * @returns {MonitorStoreExposes} 包含所有 store 状态和方法的对象
 */
export const useStore = () => {
	const store = useMonitorStore()
	return { ...store, ...storeToRefs(store) }
}
