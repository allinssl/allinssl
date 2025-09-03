/**
 * 订单管理页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { ref, onMounted, defineComponent, type PropType } from 'vue'
import {
	useDialog,
	NInput,
	NButton,
	NTag,
	NSpace,
	NDatePicker,
	NFlex,
	DataTableColumns,
	NCard,
	NIcon,
	NBackTop,
} from 'naive-ui'
import { formatCurrency } from '@baota/utils/data'

import { formatRelativeTime } from '@baota/utils/date'
import { useOrderState, ORDER_STATUS, STATUS_OPTIONS, TYPE_OPTIONS } from './useStore'
import { useTable, useForm, useFormHooks } from '@baota/naive-ui/hooks'
import { useApp } from '@/components/layout/useStore'

import type { FetchOrdersRequest, OrderItem } from '@/types/order'

/**
 * 订单管理页面控制器
 * @param props 组件属性
 * @param emit 事件发射器
 */
export function useController() {
	const dialog = useDialog()

	// 获取状态管理
	const {
		overviewStats,
		overviewCards,
		dateTimeRange,
		fetchOrdersParms,
		fetchOrderList,
		cancelOrderById,
		getOrderStatusText,
		getOrderStatusType,
		getOrderStatusColor,
		getOrderTypeText,
		getOrderTypeColor,
	} = useOrderState()
	const { useFormInput, useFormSelect } = useFormHooks()
	// 获取移动端状态
	const { isMobile } = useApp()

	// 表单配置
	const formConfig = () => [
		{
			type: 'custom' as const,
			render: () => {
				return (
					<NDatePicker
						v-model:value={dateTimeRange.value}
						type="datetimerange"
						on-update:value={(value: [number, number] | null) => {
							if (value) {
								// 同时更新两个状态，保持数据同步
								dateTimeRange.value = value
								fetchOrdersParms.value = {
									...fetchOrdersParms.value,
									start_time: value[0] / 1000,
									end_time: value[1] / 1000,
								}
							} else {
								// 清空时间选择
								dateTimeRange.value = null
								fetchOrdersParms.value = {
									...fetchOrdersParms.value,
									start_time: 0,
									end_time: 0,
								}
							}
						}}
						class={isMobile.value ? 'w-full mb-2' : 'mr-4'}
						clearable
					/>
				)
			},
		},

		useFormSelect(
			'订单状态',
			'status',
			STATUS_OPTIONS,
			{
				placeholder: '全部状态',
				class: 'w-32',
			},
			{ showLabel: false, showFeedback: false },
		),
		useFormSelect(
			'订单类型',
			'order_type',
			TYPE_OPTIONS,
			{
				placeholder: '全部类型',
				class: 'w-32',
			},
			{ showLabel: false, showFeedback: false },
		),
		useFormInput(
			'订单号',
			'order_no',
			{
				placeholder: '请输入订单号',
				clearable: true,
			},
			{ showLabel: false, showFeedback: false },
		),
		{
			type: 'custom' as const,
			render: () => (
				<NFlex>
					<NSpace>
						<NButton type="primary" onClick={() => handleFormSearch()}>
							查询
						</NButton>
					</NSpace>
				</NFlex>
			),
		},
	]

	/**
	 * 创建表格列配置
	 */
	const createColumns = [
		{
			title: '订单号',
			key: 'son_order_no',
			width: 220,
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: '域名',
			key: 'full_domain',
			minWidth: 120,
		},
		{
			title: '订单类型',
			key: 'order_type',
			width: 120,
			render: (row) => getOrderTypeText(row.order_type),
		},
		{
			title: '订单状态',
			key: 'status',
			width: 100,
			render: (row) => (
				<NTag type={getOrderStatusType(row.status)} size="small">
					{getOrderStatusText(row.status)}
				</NTag>
			),
		},
		{
			title: '金额',
			key: 'total_amount',
			width: 100,
			render: (row) => formatCurrency(parseFloat(row.total_amount)),
		},
		{
			title: '创建时间',
			key: 'created_at',
			width: 180,
			render: (row) => formatRelativeTime(row.created_at),
		},
		{
			title: '操作',
			key: 'actions',
			width: 100,
			align: 'right',
			fixed: 'right',
			render: (row) => (
				<NSpace justify="end">
					{row.status === ORDER_STATUS.PENDING && (
						<NButton size="small" type="warning" ghost onClick={() => handleCancelOrder(row)}>
							取消
						</NButton>
					)}
				</NSpace>
			),
		},
	] as DataTableColumns<OrderItem>

	/**
	 * 移动端卡片组件
	 */
	const OrderCardList = defineComponent({
		name: 'OrderCardList',
		props: {
			data: {
				type: Array as PropType<OrderItem[]>,
				default: () => [],
			},
			loading: {
				type: Boolean,
				default: false,
			},
		},
		setup(props) {
			const { scrollbarContentRef } = useApp()
			return () => (
				<NFlex vertical size="medium">
					{props.data.map((item: OrderItem) => (
						<NCard key={item.id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								{/* 订单号和状态 */}
								<NFlex align="center" justify="space-between">
									<NFlex align="center" size="small">
										<div>
											<div class="font-medium text-base">{item.son_order_no}</div>
											<div class="text-xs text-gray-500">{getOrderTypeText(item.order_type)}</div>
										</div>
									</NFlex>
									<NTag type={getOrderStatusType(item.status)} bordered={false} size="small">
										{getOrderStatusText(item.status)}
									</NTag>
								</NFlex>

								{/* 域名信息 */}
								<NFlex align="center" justify="space-between">
									<div class="text-sm text-gray-600">
										<span class="text-gray-500">域名：</span>
										{item.full_domain}
									</div>
									<div class="amount-text">{formatCurrency(parseFloat(item.total_amount))}</div>
								</NFlex>

								{/* 时间信息 */}
								<NFlex justify="space-between" class="time-text">
									<div>
										<span class="text-gray-500">创建时间：</span>
										{formatRelativeTime(item.created_at)}
									</div>
								</NFlex>

								{/* 操作按钮 */}
								{item.status === ORDER_STATUS.PENDING && (
									<NFlex justify="end" size="small">
										<NButton size="small" type="warning" ghost onClick={() => handleCancelOrder(item)}>
											取消订单
										</NButton>
									</NFlex>
								)}
							</NFlex>
						</NCard>
					))}
					{/* 移动端返回顶部按钮 */}
					{isMobile.value && <NBackTop visibility-height={180} right={20} bottom={80} />}
				</NFlex>
			)
		},
	})

	// 表格实例
	const {
		TableComponent: OrderTable,
		PageComponent: OrderTablePage,
		loading: tableLoading,
		param,
		data,
		fetch,
	} = useTable<OrderItem, FetchOrdersRequest>({
		config: createColumns,
		request: fetchOrderList,
		defaultValue: fetchOrdersParms,
		alias: {
			page: 'p',
			pageSize: 'rows',
		},
		watchValue: ['p', 'rows', 'order_type', 'status'],
	})

	//表单实例
	const { component: FilterForm, fetch: formFetchSearch } = useForm<FetchOrdersRequest>({
		config: formConfig(),
		defaultValue: fetchOrdersParms,
		request: handleFormSearch,
	})

	// -------------------- 事件处理 --------------------

	/**
	 * 处理表单搜索
	 * @param formData 表单数据
	 */
	async function handleFormSearch() {
		// 将表单数据同步到表格参数
		await fetch()
		param.value.p = 1 // 重置到第一页
	}

	/**
	 * 处理表单重置
	 */
	function formDataReset() {
		// 重置表单数据
		fetchOrdersParms.value = {
			p: 1,
			rows: 10,
			order_no: '',
			order_type: -1,
			status: -1,
			start_time: 0,
			end_time: 0,
		}
		// 同时重置时间选择器状态
		dateTimeRange.value = null
	}

	/**
	 * 处理取消订单
	 * @param order 订单信息
	 */
	function handleCancelOrder(order: OrderItem) {
		// 弹出输入取消原因的对话框
		dialog.create({
			title: '取消订单',
			type: 'warning',
			content: () => {
				const reason = ref('取消订单')
				return (
					<div>
						<p class="mb-4">请输入取消原因：</p>
						<NInput v-model:value={reason.value} type="textarea" placeholder="请输入取消原因" rows={3} />
					</div>
				)
			},
			positiveText: '确认',
			negativeText: '取消',
			onPositiveClick: () => {
				const reason = '用户主动取消' // 这里应该获取用户输入的原因
				cancelOrderById(order.id, reason)
				fetch()
			},
		})
	}

	// 初始化时获取订单列表
	onMounted(fetch)

	return {
		// 状态
		loading: tableLoading,
		isMobile,
		overviewStats,
		overviewCards,
		fetchOrdersParms,

		// 工具方法
		handleCancelOrder,
		getOrderStatusText,
		getOrderStatusType,
		getOrderStatusColor,
		getOrderTypeText,
		getOrderTypeColor,

		// 表格组件和数据
		OrderTable,
		OrderTablePage,
		param,
		data,
		fetch,

		// 移动端卡片
		OrderCardList,

		// 表单组件和数据
		FilterForm,
		formFetchSearch,
		formDataReset,
	}
}
