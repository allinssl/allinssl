/**
 * 操作日志页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { defineComponent, type PropType } from 'vue'
import { NButton, NTag, NSpace, NCard, NFlex, NTooltip } from 'naive-ui'
import { formatDate } from '@baota/utils/date'
import { useTable, useForm, useFormHooks, useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { getOperateLog } from '@/api/operate-log'
import type { OperateLogData, OperateLogRequest } from '@/api/operate-log'
import { useApp } from '@/components/layout/useStore'
import { TableColumns } from 'naive-ui/es/data-table/src/interface'

// 定义标签类型
type TagType = 'default' | 'success' | 'warning' | 'error' | 'info'

/**
 * 获取日志级别对应的标签类型
 */
function getLogLevelType(level: string): TagType {
	switch (level?.toLowerCase()) {
		case 'info':
			return 'info'
		case 'warning':
			return 'warning'
		case 'error':
			return 'error'
		case 'debug':
			return 'default'
		default:
			return 'default'
	}
}

/**
 * 操作日志页面控制器
 */
export function useController() {
	// 获取移动端状态
	const { isMobile } = useApp()
	const { useFormInput } = useFormHooks()
	const message = useMessage()
	const { handleError } = useError()

	// 默认查询参数
	const defaultParams = ref<OperateLogRequest>({
		keyword: '',
		p: 1,
		rows: 10,
	})

	/**
	 * 表单配置
	 */
	const formConfig = () => [
		useFormInput(
			'',
			'keyword',
			{
				placeholder: '请输入操作内容',
				clearable: true,
			},
			{ showLabel: false, showFeedback: false },
		),
		{
			type: 'custom' as const,
			render: () => (
				<NSpace>
					<NButton type="primary" onClick={() => formFetchSearch()}>
						搜索
					</NButton>
				</NSpace>
			),
		},
	]

	/**
	 * 表格列配置
	 */
	const createColumns = [
		{
			title: '日志ID',
			key: 'log_id',
			width: 60,
		},
		{
			title: '级别',
			key: 'level',
			width: 60,
			render: (row: OperateLogData) => (
				<NTag type={getLogLevelType(row.level)} bordered={false} size="small">
					{row.level?.toUpperCase() || 'INFO'}
				</NTag>
			),
		},
		{
			title: '客户端IP',
			key: 'remote_addr',
			width: 140,
			render: (row: OperateLogData) => <span class="text-gray-600 ">{row.remote_addr || '-'}</span>,
		},
		{
			title: '模块',
			key: 'module',
			width: 120,
			render: (row: OperateLogData) => <span class="text-gray-600">{row.module || '-'}</span>,
		},
		{
			title: '请求方法',
			key: 'request_method',
			width: 100,
			render: (row: OperateLogData) => (
				<NTag type="info" bordered={false} size="small">
					{row.request_method || '-'}
				</NTag>
			),
		},
		{
			title: '请求URL',
			key: 'request_url',
			width: 200,
			render: (row: OperateLogData) => <span class="text-gray-600 ">{row.request_url || '-'}</span>,
		},
		{
			title: '操作内容',
			key: 'message',
			width: 400,
			render: (row: OperateLogData) => <div class="text-sm">{row.message || '-'}</div>,
		},

		{
			title: '创建时间',
			key: 'created_at',
			width: 180,
			align: 'right',
			fixed: 'right',
			render: (row: OperateLogData) => (
				<span class="text-gray-600 text-sm">{formatDate(row.created_at, 'yyyy-MM-dd HH:mm:ss')}</span>
			),
		},
	] as TableColumns<OperateLogData>

	/**
	 * 移动端卡片组件
	 */
	const OperateLogCardList = defineComponent({
		name: 'OperateLogCardList',
		props: {
			data: {
				type: Array as PropType<OperateLogData[]>,
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
					{props.data.map((item: OperateLogData) => (
						<NCard key={item.log_id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								{/* 日志级别和模块 */}
								<NFlex align="center" justify="space-between">
									<NFlex align="center" size="small">
										<NTag type={getLogLevelType(item.level)} bordered={false} size="small">
											{item.level?.toUpperCase() || 'INFO'}
										</NTag>
										{item.module && <span class="text-gray-600 text-sm">{item.module}</span>}
									</NFlex>
									<span class="text-gray-500">{formatDate(item.created_at, 'MM-dd HH:mm')}</span>
								</NFlex>

								{/* 操作内容 */}
								<div class="text-sm text-gray-800">{item.message || '-'}</div>

								{/* 请求信息 */}
								<NFlex justify="space-between" class="text-gray-500">
									<div>
										<span class="text-gray-400">方法：</span>
										<NTag type="info" bordered={false} size="tiny">
											{item.request_method || '-'}
										</NTag>
									</div>
									<div>
										<span class="text-gray-400">IP：</span>
										<span>{item.remote_addr || '-'}</span>
									</div>
								</NFlex>

								{/* 请求地址 */}
								{item.request_url && (
									<div class="text-gray-500 bg-gray-50 p-2 rounded">{item.request_url}</div>
								)}
							</NFlex>
						</NCard>
					))}
				</NFlex>
			)
		},
	})

	/**
	 * 获取操作日志列表
	 * @param params 查询参数
	 */
	const fetchOperationListData = async <T = OperateLogData,>(params: OperateLogRequest = {}) => {
		try {
			loading.value = true
			const { data } = await getOperateLog(params).fetch()
			return { list: data?.data as T[], total: data?.count || 0 }
		} catch (error) {
			handleError(error)
			message.error('加载域名列表失败')
			return { list: [] as T[], total: 0 }
		} finally {
			loading.value = false
		}
	}

	// 表格实例
	const {
		TableComponent: OperateLogTable,
		PageComponent: OperateLogTablePage,
		loading,
		param,
		fetch: fetchOperateLog,
		data: tableData,
	} = useTable<OperateLogData, OperateLogRequest>({
		config: createColumns,
		request: fetchOperationListData,
		defaultValue: defaultParams,
		alias: {
			page: 'p',
			pageSize: 'rows',
		},
		watchValue: ['p', 'rows'],
	})

	// 表单实例
	const { component: FilterForm, fetch: formFetchSearch } = useForm<OperateLogRequest>({
		config: formConfig(),
		defaultValue: defaultParams,
		request: handleFormSearch,
	})
	/**
	 * 表单搜索触发
	 */
	async function handleFormSearch() {
		await fetchOperateLog()
	}

	// 组件挂载时获取路由参数
	onMounted(async () => { 
		await fetchOperateLog()
	})


	return {
		// 表格相关
		OperateLogTable,
		OperateLogTablePage,
		OperateLogCardList,
		loading,
		tableData,
		fetchOperateLog,

		// 表单相关
		FilterForm,
		formFetchSearch,

		// 状态
		isMobile,
	}
}