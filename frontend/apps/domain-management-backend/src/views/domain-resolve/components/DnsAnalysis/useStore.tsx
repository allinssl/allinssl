/**
 * @fileoverview DNS分析模块 - 状态管理层
 * @description 使用Pinia管理DNS记录相关状态，提供数据获取和操作方法
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import {
	getDnsRecordList,
	createDnsRecord,
	updateDnsRecord,
	deleteDnsRecord,
	getViews,
	getRecordTypeList,
	pauseDnsRecord,
	startDnsRecord,
} from '@/api/dns'
import type {
	GetDnsRecordListRequest,
	UpdateDnsRecordRequest,
	DeleteDnsRecordRequest,
	CreateDnsRecordRequest,
	ToggleDnsRecordRequest,
	DnsView,
	DnsRecordType,
} from '@/types/dns'
import type { DnsRecordItem } from '@/types/domain'
import { useError } from '@baota/hooks/error'
import { CascaderOption, PaginationProps, SelectOption } from 'naive-ui'

// 错误处理
const { handleError } = useError()

/**
 * DNS分析模块状态管理
 */
export const useDnsAnalysisStare = defineStore('dnsAnalysis', () => {
	// 状态定义
	const dnsRecords = ref<DnsRecordItem[]>([]) /** 解析记录列表 */
	const currentDomainType = ref<number>(1) /** 当前域名类型：1=宝塔内部域名，2=外部域名 */
	const recordListParams = ref<GetDnsRecordListRequest>({
		domain_id: 0,
		domain_type: 1,
		searchKey: 'record',
		searchValue: '',
		row: 10,
		p: 1,
	})
	const searchKeyOptions = ref<SelectOption[]>([
		{
			label: '主机记录',
			value: 'record',
		},
		{
			label: '解析值',
			value: 'value',
		},
		{
			label: '记录类型',
			value: 'type',
		},
		{
			label: '备注',
			value: 'remark',
		},
	])
	const isLoading = ref<boolean>(false) /** 加载状态 */
	const currentDomainId = ref<number>(0) // 当前域名ID
	// Cascader组件选项类型

	const viewsOptions = ref<CascaderOption[]>([])
	const recordTypesOptions = ref<SelectOption[]>([])

	// 分页配置
	const pagination = ref<PaginationProps>({
		page: 1,
		itemCount: 0,
		showSizePicker: true,
		pageSizes: [10, 20, 50, 100],
		prefix: ({ itemCount }) => `共 ${itemCount} 条`,
	})

	// 计算属性
	const hasRecords = computed(() => dnsRecords.value.length > 0)
	const recordCount = computed(() => dnsRecords.value.length)

	/**
	 * 设置当前域名ID
	 * @param id 域名ID
	 */
	const setCurrentDomainId = (id: number): void => {
		currentDomainId.value = id
	}

	/**
	 * 设置当前域名类型
	 * @param type 域名类型：1=宝塔内部域名，2=外部域名
	 */
	const setCurrentDomainType = (type: number): void => {
		currentDomainType.value = type
		recordListParams.value.domain_type = type
	}

	/**
	 * 获取DNS记录列表
	 * @param params 查询参数
	 */
	const fetchRecords = async (params?: GetDnsRecordListRequest) => {
		isLoading.value = true
		try {
			const { fetch, data } = getDnsRecordList({
				...recordListParams.value,
				...(params || {}),
				...{ 
					domain_id: currentDomainId.value,
					domain_type: currentDomainType.value,
				},
			})
			await fetch()
			const {
				data: { data: recordList, count },
			} = data.value
			dnsRecords.value = recordList || []
			pagination.value.itemCount = count
		} catch (err) {
			handleError(err)
			dnsRecords.value = []
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 获取线路列表
	 * @description 转换为Cascader组件所需的数据格式
	 */
	const fetchViews = async (): Promise<void> => {
		isLoading.value = true
		try {
			const { fetch, data } = getViews()
			await fetch()
			const { data: viewList } = data.value

			// 转换为Cascader组件所需的数据格式
			const transformToCascaderOptions = (viewsOptions: DnsView[]): CascaderOption[] => {
				return viewsOptions.map((view) => ({
					label: view.name,
					value: view.viewId,
					disabled: !view.free,
					children: view.children && view.children.length > 0 ? transformToCascaderOptions(view.children) : undefined,
				}))
			}
			viewsOptions.value = transformToCascaderOptions(viewList) || []
		} catch (err) {
			handleError(err)
			viewsOptions.value = []
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 获取解析记录类型列表
	 */
	const fetchRecordTypes = async (): Promise<void> => {
		isLoading.value = true
		try {
			const { fetch, data } = getRecordTypeList()
			await fetch()
			const { data: typeList } = data.value
			recordTypesOptions.value =
				typeList.map((item: DnsRecordType) => ({
					label: item.type,
					value: item.type,
					desc: item.desc,
				})) || []
			console.log(recordTypesOptions.value)
		} catch (err) {
			handleError(err)
			recordTypesOptions.value = []
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 创建DNS记录
	 * @param params 创建参数
	 * @returns 是否创建成功
	 */
	const createRecord = async (params: CreateDnsRecordRequest) => {
		isLoading.value = true
		try {
			const { fetch, data, message } = createDnsRecord({
				...params,
				domain_type: currentDomainType.value,
			})
			message.value = true
			await fetch()
			return data.value
		} catch (err) {
			handleError(err)
			return false
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 更新DNS记录
	 * @param params 更新参数
	 * @returns 是否更新成功
	 */
	const updateRecord = async (params: UpdateDnsRecordRequest) => {
		isLoading.value = true
		try {
			const { fetch, data, message } = updateDnsRecord({
				...params,
				domain_type: currentDomainType.value,
			})
			message.value = true
			await fetch()
			return data.value
		} catch (err) {
			handleError(err)
			return false
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 删除DNS记录
	 * @param params 删除参数
	 * @returns 是否删除成功
	 */
	const deleteRecord = async (params: DeleteDnsRecordRequest) => {
		isLoading.value = true
		try {
			const { fetch, data, message } = deleteDnsRecord({
				...params,
				domain_type: currentDomainType.value,
			})
			message.value = true
			await fetch()
			return data.value
		} catch (err) {
			handleError(err)
			return false
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 暂停DNS解析记录
	 * @param params 暂停参数
	 * @returns 是否暂停成功
	 */
	const pauseRecord = async (params: ToggleDnsRecordRequest) => {
		isLoading.value = true
		try {
			const { fetch, data, message } = pauseDnsRecord({
				...params,
				domain_type: currentDomainType.value,
			})
			message.value = true
			await fetch()
			return data.value
		} catch (err) {
			handleError(err)
			return false
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * 启用DNS解析记录
	 * @param params 启用参数
	 * @returns 是否启用成功
	 */
	const startRecord = async (params: ToggleDnsRecordRequest) => {
		isLoading.value = true
		try {
			const { fetch, data, message } = startDnsRecord({
				...params,
				domain_type: currentDomainType.value,
			})
			message.value = true
			await fetch()
			return data.value
		} catch (err) {
			handleError(err)
			return false
		} finally {
			isLoading.value = false
		}
	}

	// 返回暴露的状态和方法
	return {
		// 状态
		dnsRecords,
		isLoading,
		pagination,
		recordListParams,
		searchKeyOptions,
		viewsOptions,
		recordTypesOptions,
		currentDomainId,

		// 计算属性
		hasRecords,
		recordCount,

		// 操作方法
		fetchRecords,
		fetchViews,
		fetchRecordTypes,
		createRecord,
		updateRecord,
		deleteRecord,
		pauseRecord,
		startRecord,
		setCurrentDomainId,
		setCurrentDomainType,
	}
})

/**
 * 获取DNS分析Store实例及其状态
 * @returns Store实例和响应式状态
 */
export const useDnsAnalysisStore = () => {
	const store = useDnsAnalysisStare()
	return {
		...store,
		...storeToRefs(store),
	}
}
