import { ref, computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { fetchDomainTransferList } from '@/api/domain'
import type { TableResponse } from '@baota/naive-ui/types/table'
import type { DomainTransferItem, DomainTransferListRequest } from '@/types/transfer'

const message = useMessage()

export const useTransferJoinStore = defineStore('domain-join-store', () => {
	const loading = ref(false)
	const filterFormData = ref<DomainTransferListRequest>({ p: 1, rows: 10 })
	const { handleError } = useError()

	// 对话框状态
	const transferStep = ref<1 | 2 | 3>(1)
	const rows = ref<Array<{ domain: string; transfer_code: string }>>([{ domain: '', transfer_code: '' }])
	const selectedTemplateId = ref<number | null>(null)
	const agree = ref<boolean>(false)
	const payChannel = ref<'balance' | 'wechat' | 'alipay'>('wechat')
	const orderInfo = ref<{ order_no: string; total_price: number; wx: string; ali: string } | null>(null)
	const balanceAvailable = ref<number>(0)
	const realNameOptions = ref<Array<{ label: string; value: number }>>([])

	// 单个域名模式的验证状态
	const rowValidation = ref<Array<{
		domainError: string
		transferCodeError: string
	}>>([])

	// 表单是否有效的计算属性
	const isFormValid = computed(() => {
		if (rows.value.length === 0) return false
		// 检查是否有非空的域名和转移码，且没有验证错误
		const hasValidRows = rows.value.some(row => row.domain.trim() && row.transfer_code.trim())
		if (!hasValidRows) return false
		
		const hasErrors = rowValidation.value.some((validation, index) => {
			if (index >= rows.value.length) return false
			const row = rows.value[index]
			if (!row) return false
			return (row.domain.trim() && validation.domainError) || 
					(row.transfer_code.trim() && validation.transferCodeError)
		})
		return !hasErrors
	})

	// 价格查询
	const transferPriceLoading = ref(false)
	const transferPriceList = ref<Array<{ domain: string; price: number; error?: string }>>([])
	const transferPriceTotal = ref<number>(0)

	const setRealNameOptions = (ops: Array<{ label: string; value: number }>) => {
		realNameOptions.value = ops || []
	}
	const setTransferPrice = (list: Array<{ domain: string; price: number; error?: string }>) => {
		transferPriceList.value = Array.isArray(list) ? list : []
		transferPriceTotal.value = transferPriceList.value.reduce((s, it) => s + Number(it.price || 0), 0)
	}
	const setTransferPriceLoading = (v: boolean) => (transferPriceLoading.value = !!v)

	const setStep = (s: 1 | 2 | 3) => (transferStep.value = s)
	const setSelectedRealNameId = (id: number | null) => (selectedTemplateId.value = id)
	const addRow = () => rows.value.push({ domain: '', transfer_code: '' })
	const removeRow = (idx: number) => { if (rows.value.length > 1) rows.value.splice(idx, 1) }
	const setRowField = (idx: number, key: 'domain' | 'transfer_code', val: string) => {
		if (!rows.value[idx]) return
		rows.value[idx][key] = val
	}
	const resetDialog = () => {
		transferStep.value = 1
		rows.value = [{ domain: '', transfer_code: '' }]
		selectedTemplateId.value = null
		agree.value = false
		payChannel.value = 'wechat'
		orderInfo.value = null
		realNameOptions.value = []
		transferPriceLoading.value = false
		transferPriceList.value = []
		transferPriceTotal.value = 0
		// 重置验证状态
		rowValidation.value = []
	}

	// 验证方法
	const validateDomain = (domain: string): string => {
		if (!domain.trim()) return '域名不能为空'
		const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
		return domainRegex.test(domain.trim()) ? '' : '域名格式不正确，请输入有效的域名格式，如：example.com'
	}

	const validateTransferCode = (code: string): string => {
		if (!code.trim()) return '转移码不能为空'
		if (code.trim().length < 6) return '转移码长度不能少于6位'
		return ''
	}

	// 验证单个输入行
	const validateRow = (index: number, field: 'domain' | 'transfer_code', value: string) => {
		// 确保验证数组有足够的长度
		while (rowValidation.value.length <= index) {
			rowValidation.value.push({ domainError: '', transferCodeError: '' })
		}
		
		const validation = rowValidation.value[index]
		if (!validation) return
		
		if (field === 'domain') {
			validation.domainError = validateDomain(value)
		} else {
			validation.transferCodeError = validateTransferCode(value)
		}
	}

	const fetchTransferListData = async <T = DomainTransferItem,>(
		params: DomainTransferListRequest = {},
	): Promise<TableResponse<T>> => {
		try {
			loading.value = true
			const { fetch, data } = fetchDomainTransferList(params)
			await fetch()
			const payload = data.value?.data
			return { list: (payload?.list as unknown as T[]) || [], total: Number(payload?.total || 0) }
		} catch (e) {
			handleError(e)
			message.error('加载转入列表失败')
			return { list: [] as unknown as T[], total: 0 }
		} finally {
			loading.value = false
		}
	}

	return {
		loading,
		filterFormData,
		fetchTransferListData,

		// 对话框状态与方法
		transferStep,
		rows,
		selectedTemplateId,
		setSelectedRealNameId,
		agree,
		payChannel,
		orderInfo,
		balanceAvailable,
		realNameOptions,
		transferPriceLoading,
		transferPriceList,
		transferPriceTotal,
		setRealNameOptions,
		setTransferPrice,
		setTransferPriceLoading,
		setStep,
		addRow,
		removeRow,
		setRowField,
		resetDialog,

		// 验证相关
		rowValidation,
		isFormValid,
		validateDomain,
		validateTransferCode,
		validateRow,
	}
})

export const useTransferJoinState = () => {
	const store = useTransferJoinStore()
	return { ...store, ...storeToRefs(store) }
} 