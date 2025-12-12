import { ref, onMounted, defineComponent, type PropType } from 'vue'
import { NFlex, NCard, NTag, NButton, NSpace } from 'naive-ui'
import { useTable, useForm, useFormHooks, useDialog, useModal } from '@baota/naive-ui/hooks'
import { useTransferOutStore } from './useStore'
import { formatDate } from '@baota/utils/date'
import type { DataTableColumns } from 'naive-ui'
import { DomainTransferOutStatus } from '@/types/transfer-enums'
import type { DomainTransferOutItem, DomainTransferOutListRequest } from '@/types/transfer'
import TransferOutDialog from '../TransferOutDialog'

/**
 * 域名转出状态类型映射
 * 0: "申请已提交"
 * 1: "申请失败"
 * 2: "取消转出"
 * 3: "转出失败"
 */
const STATUS_TYPE: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
	[DomainTransferOutStatus.Submitted]: 'info', // 申请已提交
	[DomainTransferOutStatus.Failed]: 'error', // 申请失败
	[DomainTransferOutStatus.Cancelled]: 'warning', // 取消转出
	[DomainTransferOutStatus.TransferFailed]: 'error', // 转出失败
}

const openTransferOutRef = ref()

export const useTransferOutController = () => {
	const { fetchTransferOutListData, filterFormData, handleCancelTransferOut, handleApproveTransferOut } =
		useTransferOutStore()
	const { useFormInput } = useFormHooks()

	// 处理取消转出
	async function handleCancelTransferOutAction(recordId: number) {
		useDialog({
			type: 'warning',
			title: '确认取消',
			area: '40',
			content: '确定要取消此转出申请吗？此操作不可恢复。',
			positiveText: '确定',
			negativeText: '取消',
			onPositiveClick: async () => {
				try {
					await handleCancelTransferOut(recordId)
					await gFetch()
				} catch (error) {
					console.error('取消转出失败:', error)
				}
			},
		})
	}

	// 处理同意转出
	async function handleApproveTransferOutAction(recordId: number) {
		useDialog({
			type: 'info',
			title: '确认同意转出',
			area: '40',
			content: '确定要同意此域名转出申请吗？同意后域名将开始转出流程。',
			positiveText: '确定',
			negativeText: '取消',
			onPositiveClick: async () => {
				try {
					await handleApproveTransferOut(recordId)
					await gFetch()
				} catch (error) {
					console.error('同意转出失败:', error)
				}
			},
		})
	}

	// 打开域名转出对话框
	function openTransferOutDialog() {
		openTransferOutRef.value = useModal({
			title: '域名转出',
			area: '600px',
			component: TransferOutDialog,
			componentProps: {
				refresh: gFetch,
				close: () => openTransferOutRef.value?.close?.(),
			},
			footer: false,
		})
	}

	function closeTransferOutDialog() {
		openTransferOutRef.value?.close?.()
	}

	const columns: DataTableColumns<DomainTransferOutItem> = [
		{ title: '域名', key: 'domain', width: 260 },
		{
			title: '状态',
			key: 'status_text',
			width: 140,
			render: (r: DomainTransferOutItem) => (
				<NTag type={STATUS_TYPE[r.status] || 'default'} bordered={false} size="small">
					{r.status_text}
				</NTag>
			),
		},
		{
			title: '转出提交时间',
			key: 'created_at',
			width: 180,
			render: (r: DomainTransferOutItem) => formatDate(r?.created_at || 0, 'yyyy-MM-dd'),
		},
		{
			title: '转出完成时间',
			key: 'complete_time',
			width: 180,
			render: (r: DomainTransferOutItem) => formatDate(r?.complete_time || 0, 'yyyy-MM-dd'),
		},
		{
			title: '接收邮箱',
			key: 'email',
			width: 200,
		},
		{
			title: '失败原因',
			key: 'msg',
			width: 200,
			render: (r: DomainTransferOutItem) => r.msg || '-',
		},
		{
			title: '操作',
			key: 'actions',
			width: 200,
			align: 'right',
			fixed: 'right',
			render: (r: DomainTransferOutItem) => (
				<NSpace justify="end">
					{r.status === DomainTransferOutStatus.Submitted && (
						<>
							<NButton size="small" ghost onClick={() => handleCancelTransferOutAction(r.domain_id)}>
								取消转出
							</NButton>
							<NButton size="small" ghost type="primary" onClick={() => handleApproveTransferOutAction(r.domain_id)}>
								同意转出
							</NButton>
						</>
					)}
				</NSpace>
			),
		},
	]

	/**
	 * 移动端卡片组件
	 */
	const TransferOutCardList = defineComponent({
		name: 'TransferOutCardList',
		props: {
			data: {
				type: Array as PropType<DomainTransferOutItem[]>,
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
					{props.data.map((item: DomainTransferOutItem) => (
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
									<span class="text-gray-500">转出提交时间：</span>
									{formatDate(item?.created_at || 0, 'yyyy-MM-dd')}
								</div>
							</NFlex>
							<NFlex class="text-sm text-gray-600">
								<div>
									<span class="text-gray-500">转出完成时间：</span>
									{formatDate(item?.complete_time || 0, 'yyyy-MM-dd')}
								</div>
							</NFlex>
							{/* 操作按钮 */}
							<NFlex justify="end" size="small">
								{item.status === DomainTransferOutStatus.Submitted && (
									<>
										<NButton
											size="small"
											ghost
											type="warning"
											onClick={() => handleCancelTransferOutAction(item.domain_id)}
										>
											取消转出
										</NButton>
										<NButton size="small" type="primary" onClick={() => handleApproveTransferOutAction(item.domain_id)}>
											同意转出
										</NButton>
									</>
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
	} = useTable<DomainTransferOutItem, DomainTransferOutListRequest>({
		config: columns,
		request: fetchTransferOutListData,
		defaultValue: filterFormData,
		alias: { page: 'p', pageSize: 'rows' },
		watchValue: ['p', 'rows'],
	})

	// 顶部搜索
	async function handleSearch() {
		console.log(filterFormData)
		await gFetch()
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

	const { component: FilterForm, fetch: formFetchSearch } = useForm<DomainTransferOutListRequest>({
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
		TransferOutCardList,
		// 页面动作
		handleSearch,
		handleCancelTransferOut: handleCancelTransferOutAction,
		openTransferOutDialog,
		closeTransferOutDialog,
	}
}
