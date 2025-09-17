/**
 * 域名解析页面状态管理
 * 负责管理解析记录数据、筛选条件、分页等状态
 */

import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { getResolveList, checkDomainStatus } from '@/api/resolve'

import type { TableResponse } from '@baota/naive-ui/types/table'
import type { ResolveItem, ResolveListRequest, StatusOption } from './types.d'

/** NS状态映射配置（后端数值 -> 前端联合类型） */
const NS_STATUS_MAP: Record<number, "notSet" | "active" | "pending"> = {
	0: "notSet", // 未设置
	1: "active", // 已生效
	2: "pending", // 未生效
} as const

/** NS状态显示配置 */
const NS_STATUS_CONFIG = {
	notSet: {
		type: "default" as const,
		text: "未设置",
		color: "#909399", // 灰色
	},
	active: {
		type: "success" as const,
		text: "已生效",
		color: "#18a058", // 绿色
	},
	pending: {
		type: "warning" as const,
		text: "未生效",
		color: "#f0a020", // 橙色
	},
} as const

/** 域名类型映射配置 */
const DOMAIN_TYPE_MAP: Record<number, "platform" | "external"> = {
	1: "platform",
	2: "external",
} as const

/** 域名类型显示配置 */
const DOMAIN_TYPE_CONFIG = {
	platform: {
		type: 'info' as const,
		text: '堡塔',
	},
	external: {
		type: 'warning' as const,
		text: '外部',
	},
} as const

const message = useMessage()
const { handleError } = useError()

/**
 * 域名解析页面状态Store
 */
export const useDomainResolveStore = defineStore('domain-resolve-store', () => {
	// -------------------- 状态定义 --------------------

	/** 页面加载状态 */
	const loading = ref(false)

	/** NS状态选项 */
	const statusOptions = ref<StatusOption[]>([
		{ label: '全部状态', value: '' },
		{ label: '已生效', value: 1 },
		{ label: '未生效', value: 2 },
		{ label: '未设置', value: 0 },
	])

	/** 筛选表单数据 */
	const filterFormData = ref<ResolveListRequest>({
		p: 1,
		rows: 10,
		keyword: '',
		status: '',
	})

	/** 选中的域名信息（用于内部跳转） */
	const selectedDomainInfo = ref<{
		id: number
		name: string
		domain_type: number
	} | null>(null)

	// -------------------- 方法定义 --------------------

	/**
	 * 获取解析记录列表数据
	 * @param params 查询参数
	 */
	const fetchResolveListData = async <T = ResolveItem>(
		params: ResolveListRequest = {}
	): Promise<TableResponse<T>> => {
		try {
			loading.value = true
			
			// 处理参数：只有status有值时才传递该参数
			const requestParams = { ...params }
			if (requestParams.status === '' || requestParams.status === undefined) {
				delete requestParams.status
			}
			
			const { fetch, data } = getResolveList(requestParams)
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
			message.error('加载解析记录列表失败')
		} finally {
			loading.value = false
		}
		return { list: [] as T[], total: 0 }
	}

	/**
	 * 设置选中的域名信息
	 * @param info 域名信息
	 */
	const setSelectedDomainInfo = (info: { id: number; name: string; domain_type: number }) => {
		selectedDomainInfo.value = info
	}

	/**
	 * 清除选中的域名信息
	 */
	const clearSelectedDomainInfo = () => {
		selectedDomainInfo.value = null
	}

	/**
	 * 检测域名状态
	 * @param domainId 域名ID
	 * @param domainType 域名类型
	 */
	const checkDomainStatusApi = async (domainId: number, domainType?: number) => {
		try {
			const { fetch, data, message } = checkDomainStatus({
				domain_id: domainId,
				domain_type: domainType
			})
			message.value = true
			await fetch()
			if (data.value?.status) {
				return data.value
			}
		} catch (error) {
			handleError(error)
		}
	}

	// 返回状态和方法
	return {
		// 状态
		loading,
		statusOptions,
		filterFormData,
		selectedDomainInfo,

		// 方法
		fetchResolveListData,
		setSelectedDomainInfo,
		clearSelectedDomainInfo,
		checkDomainStatusApi,

		// 常量
		NS_STATUS_CONFIG,
		NS_STATUS_MAP,
		DOMAIN_TYPE_CONFIG,
		DOMAIN_TYPE_MAP,
	}
})

/**
 * 导出Store实例
 */
export const useDomainResolveState = () => {
	const store = useDomainResolveStore()
	const storeRefs = storeToRefs(store)
	return {
		// 响应式状态
		...storeRefs,
		// 方法
		fetchResolveListData: store.fetchResolveListData,
		setSelectedDomainInfo: store.setSelectedDomainInfo,
		clearSelectedDomainInfo: store.clearSelectedDomainInfo,
		checkDomainStatusApi: store.checkDomainStatusApi,
		// 常量
		NS_STATUS_CONFIG: store.NS_STATUS_CONFIG,
		NS_STATUS_MAP: store.NS_STATUS_MAP,
		DOMAIN_TYPE_CONFIG: store.DOMAIN_TYPE_CONFIG,
		DOMAIN_TYPE_MAP: store.DOMAIN_TYPE_MAP,
	}
}
