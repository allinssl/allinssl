import { ref, onMounted, defineComponent, type PropType } from 'vue'
import { NFlex, NCard, NTag, NButton, NSpace } from 'naive-ui'
import { useTable, useForm, useFormHooks, useModal } from '@baota/naive-ui/hooks'
import { useBtAccountTransferState } from './useStore'
import { formatDate } from '@baota/utils/date'
import type { DataTableColumns } from 'naive-ui'
import { BtAccountTransferStatus } from '@/types/transfer-enums'
import type { 
	BtAccountTransferItem, 
	BtAccountTransferListRequest
} from '@/types/transfer'
import BtAccountTransferDialog from '../BtAccountTransferDialog'

const STATUS_TYPE: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
	[BtAccountTransferStatus.Submitted]: 'info', // 申请已提交
	[BtAccountTransferStatus.Failed]: 'error', // 申请失败
	[BtAccountTransferStatus.Cancelled]: 'warning', // 取消转入
	[BtAccountTransferStatus.TransferFailed]: 'error', // 转入失败
	[BtAccountTransferStatus.TransferSuccess]: 'success', // 转入成功
}

const openTransferDialogRef = ref()

export const useBtAccountTransferController = () => {
	const state = useBtAccountTransferState()
	const { useFormInput } = useFormHooks()

	// 表格列配置
	const columns: DataTableColumns<BtAccountTransferItem> = [
		{
			title: '域名',
			key: 'domain',
			width: 200,
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: '转入时间',
			key: 'created_at',
			width: 180,
			render: (r: BtAccountTransferItem) => formatDate(r?.created_at || 0, 'yyyy-MM-dd HH:mm'),
		},
		{
			title: '源账号',
			key: 'from_account',
			width: 120,
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: '状态',
			key: 'status',
			width: 120,
			render: (r: BtAccountTransferItem) => (
				<NTag type={STATUS_TYPE[r.status] || 'default'} bordered={false} size="small">
					{r.status_text}
				</NTag>
			),
		},
	]

	/**
	 * 移动端卡片组件
	 */
	const BtAccountTransferCardList = defineComponent({
		name: 'BtAccountTransferCardList',
		props: {
			data: {
				type: Array as PropType<BtAccountTransferItem[]>,
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
					{props.data?.map((item) => (
						<NCard key={item.id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								{/* 域名信息 */}
								<NFlex justify="space-between" align="center">
									<div class="text-base font-medium text-gray-900">{item.domain}</div>
									<NTag type={STATUS_TYPE[item.status] || 'default'} bordered={false} size="small">
										{item.status_text}
									</NTag>
								</NFlex>

								{/* 时间信息 */}
								<NFlex justify="space-between" size="small">
									<div class="text-sm text-gray-500">转入时间</div>
									<div class="text-sm text-gray-900">
										{formatDate(item?.created_at || 0, 'yyyy-MM-dd HH:mm')}
									</div>
								</NFlex>

								{/* 源账号信息 */}
								<NFlex justify="space-between" size="small">
									<div class="text-sm text-gray-500">源账号</div>
									<div class="text-sm text-gray-900">{item.from_account}</div>
								</NFlex>
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
	} = useTable<BtAccountTransferItem, BtAccountTransferListRequest>({
		config: columns,
		request: state.fetchBtAccountTransferListData,
		defaultValue: state.filterFormData,
		alias: { page: 'p', pageSize: 'rows' },
		watchValue: ['p', 'rows'],
	})

	// 顶部搜索
	async function handleSearch() {
		await gFetch()
	}

	// 打开转入对话框
	const openTransferDialog = () => {
		openTransferDialogRef.value = useModal({
			title: '堡塔账号转入',
			area: '720px',
			component: BtAccountTransferDialog,
			componentProps: {
				refresh: gFetch,
				close: () => openTransferDialogRef.value?.close?.(),
			},
			footer: false,
		})
	}

	// 查看详情
	const handleViewDetails = (record: BtAccountTransferItem) => {
		// TODO: 实现详情查看逻辑
		console.log('查看详情:', record)
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

	const { component: FilterForm, fetch: formFetchSearch } = useForm<BtAccountTransferListRequest>({
		config: formConfig(),
		defaultValue: state.filterFormData,
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
		BtAccountTransferCardList,
		// 页面动作
		handleSearch,
		openTransferDialog,
		handleViewDetails,
	}
}