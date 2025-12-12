import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { fetchDomainTransferOutList, cancelDomainTransferOut, approveDomainTransferOut } from '@/api/transfer'
import type { TableResponse } from '@baota/naive-ui/types/table'
import type { DomainTransferOutListRequest, DomainTransferOutItem } from '@/types/transfer'

const message = useMessage()

export const useTransferOutStore = defineStore('domain-transfer-out-store', () => {
	const loading = ref(false)
	const filterFormData = ref<DomainTransferOutListRequest>({ p: 1, rows: 20 })
	const { handleError } = useError()

	// 获取转出列表数据
	const fetchTransferOutListData = async <T = DomainTransferOutItem,>(
		params: DomainTransferOutListRequest = {},
	): Promise<TableResponse<T>> => {
		try {
			loading.value = true
			const { fetch, data } = fetchDomainTransferOutList({ ...params })
			await fetch()
			const payload = data.value?.data
			return { list: (payload?.list as unknown as T[]) || [], total: Number(payload?.total || 0) }
		} catch (e) {
			handleError(e)
			message.error('加载转出列表失败')
			return { list: [] as unknown as T[], total: 0 }
		} finally {
			loading.value = false
		}
	}

	// 取消转出
	const handleCancelTransferOut = async (id: number) => {
		try {
			const { fetch, message } = cancelDomainTransferOut({ domain_id: id })
			message.value = true
			await fetch()
			
		} catch (e) {
			handleError(e)
			message.error('取消转出失败')
		}
	}

	// 同意转出
	const handleApproveTransferOut = async (id: number) => {
		try {
			const { fetch,message } = approveDomainTransferOut({ domain_id: id })
			message.value = true
			await fetch()
		} catch (e) {
			handleError(e)
			message.error('同意转出失败')
		}
	}

	return {
		loading,
		filterFormData,
		fetchTransferOutListData,
		handleCancelTransferOut,
		handleApproveTransferOut,
	}
})

export const useTransferOutState = () => {
	const store = useTransferOutStore()
	return { ...store, ...storeToRefs(store) }
}