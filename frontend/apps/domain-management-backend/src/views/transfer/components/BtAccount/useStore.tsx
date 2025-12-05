import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { fetchBtAccountTransferList, executeBtAccountTransfer } from '@/api/transfer'
import type { TableResponse } from '@baota/naive-ui/types/table'
import type { BtAccountTransferItem, BtAccountTransferListRequest, BtAccountTransferRequest } from '@/types/transfer'

const message = useMessage()

export const useBtAccountTransferStore = defineStore('bt-account-transfer-store', () => {
	const loading = ref(false)
	const filterFormData = ref<BtAccountTransferListRequest>({ p: 1, rows: 20 })
	const { handleError } = useError()

	// 对话框状态
	const transferDialogVisible = ref(false)
	const transferFormData = ref<BtAccountTransferRequest>({
		from_account: '',
		domain_list: [{ domain: '', transfer_code: '' }],
	})

	// 获取堡塔账号转入列表数据
	const fetchBtAccountTransferListData = async <T = BtAccountTransferItem,>(
		params: BtAccountTransferListRequest = {},
	): Promise<TableResponse<T>> => {
		try {
			loading.value = true
			const { fetch, data } = fetchBtAccountTransferList({ ...params })
			await fetch()
			const payload = data.value?.data
			return { list: (payload?.list as unknown as T[]) || [], total: Number(payload?.total || 0) }
		} catch (e) {
			handleError(e)
			message.error('加载堡塔账号转入列表失败')
			return { list: [] as unknown as T[], total: 0 }
		} finally {
			loading.value = false
		}
	}

	// 执行堡塔账号转入操作
	const handleBtAccountTransfer = async (params: BtAccountTransferRequest) => {
		try {
			loading.value = true
			const { fetch, data } = executeBtAccountTransfer(params)
			await fetch()

			if (data.value?.code === 200) {
				message.success('堡塔账号转入申请提交成功')
				transferDialogVisible.value = false
				// 重置表单
				transferFormData.value = {
					from_account: '',
					domain_list: [{ domain: '', transfer_code: '' }],
				}
				return true
			} else {
				message.error(data.value?.msg || '堡塔账号转入申请失败')
				return false
			}
		} catch (e) {
			handleError(e)
			message.error('堡塔账号转入申请失败')
			return false
		} finally {
			loading.value = false
		}
	}

	// 打开转入对话框
	const openTransferDialog = () => {
		transferDialogVisible.value = true
	}

	// 关闭转入对话框
	const closeTransferDialog = () => {
		transferDialogVisible.value = false
		// 重置表单
		transferFormData.value = {
			from_account: '',
			domain_list: [{ domain: '', transfer_code: '' }],
		}
	}

	// 添加域名行
	const addDomainRow = () => {
		transferFormData.value.domain_list.push({ domain: '', transfer_code: '' })
	}

	// 删除域名行
	const removeDomainRow = (index: number) => {
		if (transferFormData.value.domain_list.length > 1) {
			transferFormData.value.domain_list.splice(index, 1)
		}
	}

	return {
		loading,
		filterFormData,
		transferDialogVisible,
		transferFormData,
		fetchBtAccountTransferListData,
		handleBtAccountTransfer,
		openTransferDialog,
		closeTransferDialog,
		addDomainRow,
		removeDomainRow,
	}
})

export const useBtAccountTransferState = () => {
	const store = useBtAccountTransferStore()
	return { ...store, ...storeToRefs(store) }
}
