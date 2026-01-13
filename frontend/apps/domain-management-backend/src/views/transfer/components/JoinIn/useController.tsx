import { ref } from 'vue'
import { NFlex, NCard, NTag, NButton, NSpace, NTooltip, NIcon } from 'naive-ui'
import { useTable, useForm, useFormHooks } from '@baota/naive-ui/hooks'
import { useTransferJoinState } from './useStore'
import type { DomainTransferItem, DomainTransferListRequest } from '@/types/transfer'
import type { DataTableColumns } from 'naive-ui'
import type { ContactTemplateItem } from '@/types/real-name'
import { formatDate } from '@baota/utils/date'
import { createTransferOrder, cancelTransfer } from '@/api/transfer'
import { fetchContactUserDetail } from '@/api/real-name'
import { useMessage } from '@baota/naive-ui/hooks'
import { useRechargeState } from '@/views/recharge/useStore'
import { useRechargeController } from '@/views/recharge/useController'
import { useModal, useDialog } from '@baota/naive-ui/hooks'
import TransferDialog from '../TransferDialog'
import TransferDetailsDialog from '../TransferDetailsDialog'
import DomainRegistrationForm from '@/views/real-name/components/DomainRegistrationForm/index'
import { queryDomainPrice } from '@/api/domain'
import { InformationCircleOutline } from '@vicons/ionicons5'

const STATUS_TYPE: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
	0: 'warning', // 申请已提交
	1: 'error', // 申请失败
	2: 'default', // 取消转入
	3: 'error', // 转入失败
	4: 'success', // 转入成功
}

const openTransferRef = ref()
const openTransferDetailsRef = ref()
export function useController() {
	const { fetchTransferListData, filterFormData } = useTransferJoinState()
	const store = useTransferJoinState()
	const { useFormInput } = useFormHooks()
	const recharge = useRechargeState()
	const { loadAccountBalance } = useRechargeController()
	const message = useMessage()
	/**
	 * 处理取消订单
	 * @param order 订单信息
	 */
	async function handleCancelTransfer(record_id: number) {
		useDialog({
			type: 'warning',
			title: '确认取消',
			area: '40',
			content: '确定要取消此转入申请吗？此操作不可恢复。',
			positiveText: '确定',
			negativeText: '取消',
			onPositiveClick: async () => {
				try {
					const { fetch, message } = cancelTransfer({ record_id })
					message.value = true
					await fetch()
					await gFetch()
				} catch (error) {
					console.error('删除模板失败:', error)
				}
			},
		})
	}
	// 打开转入对话框（可选预填）
	async function openTransferDetails(row: DomainTransferItem) {
		openTransferDetailsRef.value = useModal({
			title: '失败详情',
			area: '600px',
			component: TransferDetailsDialog,
			componentProps: {
				record: row,
				close: () => {
					openTransferDetailsRef.value?.close()
				},
			},
			footer: false,
		})
	}

	const columns: DataTableColumns<DomainTransferItem> = [
		{ title: '域名', key: 'domain', width: 260 },
		{
			title: '状态',
			key: 'status_text',
			width: 140,
			render: (r: DomainTransferItem) => {
				const tagElement = (
					<NTag type={STATUS_TYPE[r.status] || 'default'} bordered={false} size="small">
						{r.status_text}
					</NTag>
				)

				if (r.status === 0) {
					return (
						<div class="flex items-center">
							{tagElement}
							<NTooltip trigger="click">
								{{
									default: () => (
										<span>
											域名转入未完成？请参考帮助文档：
											<a
												class="text-[#20a53a] hover:text-[#20a53a]-800 text-sm underline cursor-pointer ml-1"
												href="https://docs.bt.cn/domain/user-guide/domain-transfer-in"
												target="_blank"
												rel="noopener noreferrer"
											>
												帮助文档
											</a>
										</span>
									),
									trigger: () => (
										<NIcon class="flex justify-center cursor-pointer ml-1">
											<InformationCircleOutline />
										</NIcon>
									),
								}}
							</NTooltip>
						</div>
					)
				}

				return tagElement
			},
		},
		{
			title: '转入提交时间',
			key: 'created_at',
			width: 180,
			render: (r: DomainTransferItem) => formatDate(r?.created_at || 0, 'yyyy-MM-dd'),
		},
		{
			title: '转入流程结束时间',
			key: 'complete_time',
			width: 180,
			render: (r: DomainTransferItem) => formatDate(r?.complete_time || 0, 'yyyy-MM-dd'),
		},
		{
			title: '操作',
			key: 'actions',
			width: 120,
			align: 'right',
			fixed: 'right',
			render: (r: DomainTransferItem) => (
				<NSpace justify="end">
					{r.status === 0 && (
						<NButton size="small" ghost onClick={() => handleCancelTransfer(r.id)}>
							取消
						</NButton>
					)}
					{(r.status === 1 || r.status === 3) && (
						<NButton size="small" ghost onClick={() => openTransferDetails(r)}>
							详情
						</NButton>
					)}
				</NSpace>
			),
		},
	]

	/**
	 * 移动端卡片组件
	 */
	const TransferCardList = defineComponent({
		name: 'TransferCardList',
		props: {
			data: {
				type: Array as PropType<DomainTransferItem[]>,
				default: () => [],
			},
			loading: {
				type: Boolean,
				default: false,
			},
		},
		setup(props) {
			return () => (
				<NFlex vertical size="medium">
					{props.data.map((item: DomainTransferItem) => (
						<NCard key={item.id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								{/* 域名信息 */}
								<NFlex align="center" justify="space-between">
									<NFlex align="center" size="small">
										<div>
											<div class="font-medium text-base">{item.domain}</div>
										</div>
									</NFlex>
									<NFlex align="center" size="small">
										<NTag type={STATUS_TYPE[item.status] || 'default'} bordered={false} size="small">
											{item.status_text}
										</NTag>
									</NFlex>
								</NFlex>
							</NFlex>
							{/* 时间信息 */}
							<NFlex class="text-sm text-gray-600">
								<div>
									<span class="text-gray-500">转入提交时间：</span>
									{formatDate(item?.created_at || 0, 'yyyy-MM-dd')}
								</div>
							</NFlex>
							<NFlex class="text-sm text-gray-600">
								<div>
									<span class="text-gray-500">转入流程结束时间：</span>
									{formatDate(item?.complete_time || 0, 'yyyy-MM-dd')}
								</div>
							</NFlex>
							{/* 操作按钮 */}
							<NFlex justify="end" size="small">
								{item.status === 0 && (
									<NButton size="small" ghost onClick={() => handleCancelTransfer(item.id)}>
										取消
									</NButton>
								)}
								{(item.status === 1 || item.status === 3) && (
									<NButton size="small" ghost onClick={() => openTransferDetails(item)}>
										详情
									</NButton>
								)}
							</NFlex>
						</NCard>
					))}
				</NFlex>
			)
		},
	})

	const {
		TableComponent,
		PageComponent,
		data: tableData,
		loading,
		fetch: gFetch,
		param,
	} = useTable<DomainTransferItem, DomainTransferListRequest>({
		config: columns,
		request: fetchTransferListData,
		defaultValue: filterFormData,
		alias: { page: 'p', pageSize: 'rows' },
		watchValue: ['p', 'rows'],
	})

	// 顶部搜索
	async function handleSearch() {
		await gFetch()
	}

	// 打开转入对话框（可选预填）
	async function openTransferDialog(preset?: { domain?: string }) {
		// 先重置，避免覆盖随后加载的实名模板 options
		store.resetDialog()
		await loadRealNameOptions()
		if (preset?.domain) store.rows.value = [{ domain: preset.domain, transfer_code: '' }]
		openTransferRef.value = useModal({
			title: '域名转入',
			area: '720px',
			component: TransferDialog,
			componentProps: {
				refresh: gFetch,
				close: () => openTransferRef.value?.close?.(),
			},
			footer: false,
		})
	}

	function closeTransferDialog() {
		openTransferRef.value?.close?.()
	}

	// 查询域名（仅校验非空 → Step2）
	async function checkDomains() {
		const rows = store.rows.value.map((r) => ({
			domain: r.domain.trim().toLowerCase(),
			transfer_code: r.transfer_code.trim(),
		}))
		const hasMissingCode = rows.some((r) => r.domain && !r.transfer_code)
		if (hasMissingCode) {
			message.warning('转移码不能为空')
			return
		}
		const valid = rows.filter((r) => r.domain && r.transfer_code)
		if (valid.length === 0) {
			message.warning('请填写至少一条域名与转移码')
			return
		}
		const seen = new Set<string>()
		for (const r of valid) {
			if (seen.has(r.domain)) {
				message.warning('域名已存在')
				return
			}
			seen.add(r.domain)
		}
		store.setStep(2)
		await loadTransferPrice(valid.map((v) => v.domain))
	}

	async function loadTransferPrice(domains: string[]) {
		try {
			store.setTransferPriceLoading(true)
			const { fetch, data } = queryDomainPrice({ domain: domains.join(','), year: 1, type: 'transfer' } as any)
			await fetch()
			const results = (data.value as any)?.data?.results || []
			const list = Array.isArray(results)
				? results.map((it: any) => ({
						domain: String(it.domain || ''),
						price: Number(it.price || 0),
						error: String(it.error || ''),
					}))
				: []
			console.log(list, '--')
			store.setTransferPrice(list)
		} catch {
			store.setTransferPrice([])
		} finally {
			store.setTransferPriceLoading(false)
		}
	}
	/** 选择实名模板 */
	const handleSelectRealName = (val: number) => {
		if (val === -1) openCreateRealNameModal()
		else store.setSelectedRealNameId(val)
	}
	/** 创建实名模板窗口（步骤一入口中的快捷按钮） */
	const openCreateRealNameModal = () => {
		const modal = useModal({
			title: '创建实名模板',
			area: '1000px',
			component: DomainRegistrationForm,
			componentProps: {
				mode: 'add',
				refresh: async () => {
					await loadRealNameOptions()
				},
			},
			footer: false,
		})
		return modal
	}

	// 优化：加载实名模板并写入 Store，失败兜底
	async function loadRealNameOptions() {
		try {
			const { fetch: dFetch, data: dData } = fetchContactUserDetail({ p: 1, rows: 50, status: 2 })
			await dFetch()
			const payload = dData.value as any
			const list: ContactTemplateItem[] = ((payload && payload.msg && payload.msg.data) ||
				(payload && payload.data && payload.data.data) ||
				[]) as ContactTemplateItem[]
			const options = Array.isArray(list)
				? list.map((it) => ({ label: it.template_name || it.owner_name || String(it.id), value: it.id }))
				: []
			store.setRealNameOptions(options)
			// 默认选中第一个
			store.setSelectedRealNameId(options[0]?.value || null)
		} catch {
			message.error('加载实名模板失败')
			store.setRealNameOptions([])
			return []
		}
	}

	// Step2 -> Step3 创建订单
	async function createOrder() {
		if (!store.selectedTemplateId.value) {
			message.warning('请选择实名模板')
			return
		}
		if (!store.agree.value) {
			message.warning('请勾选并同意相关协议')
			return
		}
		const payload = {
			domain_list: store.rows.value
				.map((r) => ({ domain: r.domain.trim(), transfer_code: r.transfer_code.trim() }))
				.filter((r) => r.domain && r.transfer_code),
			real_name_template_id: store.selectedTemplateId.value as number,
		}
		const { fetch, data } = createTransferOrder(payload)
		await fetch()
		if (!data.value?.status) {
			message.error(data.value?.msg || '创建订单失败')
			return
		}
		store.orderInfo.value = data.value.data as any
		store.setStep(3)
		await ensureBalance()
	}

	// 余额获取
	async function ensureBalance() {
		try {
			await loadAccountBalance()
			store.balanceAvailable.value = Number(recharge.overview.value?.balance || 0)
		} catch {
			store.balanceAvailable.value = 0
		}
	}

	/** 表单配置（列表页顶部搜索） */
	const formConfig = () => [
		useFormInput(
			'',
			'keyword',
			{ placeholder: '搜索域名', clearable: true, class: 'w-64' },
			{ showLabel: false, showFeedback: false },
		),
		{
			type: 'custom' as const,
			render: () => (
				<NSpace>
					<NButton type="primary" onClick={() => handleSearch()}>
						搜索
					</NButton>
				</NSpace>
			),
		},
	]

	const { component: FilterForm, fetch: formFetchSearch } = useForm<DomainTransferListRequest>({
		config: formConfig(),
		defaultValue: filterFormData,
		request: handleSearch,
	})

	onMounted(gFetch)

	return {
		TableComponent,
		PageComponent,
		loading,
		tableData,
		FilterForm,
		formFetchSearch,
		TransferCardList,
		// 页面动作
		handleSearch,
		openTransferDialog,
		// 对话框动作
		checkDomains,
		loadTransferPrice,
		createOrder,
		handleSelectRealName,
		loadRealNameOptions,
		closeTransferDialog,
	}
}
