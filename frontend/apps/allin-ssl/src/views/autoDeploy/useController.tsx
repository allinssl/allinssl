import { NSwitch, NTag, NButton, NSpace } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@autoDeploy/useStore'
import {
	useDialog,
	useTable,
	useTablePage,
	useModal,
	useFormHooks,
	useForm,
	useModalHooks,
} from '@baota/naive-ui/hooks'
import { useStore as useWorkflowViewStore } from '@autoDeploy/children/workflowView/useStore'
import { useError } from '@baota/hooks/error'
import AddWorkflowModal from './components/workflowModal'
import HistoryModal from './components/historyModal'
import HistoryLogsModal from './components/historyLogsModal'
import { $t } from '@/locales'
import { router } from '@router/index'

import type { WorkflowItem, WorkflowListParams, WorkflowHistoryParams, WorkflowHistoryItem } from '@/types/workflow'
import type { DataTableColumn } from 'naive-ui'
import { TableColumn } from 'naive-ui/es/data-table/src/interface'

const {
	fetchWorkflowList,
	fetchWorkflowHistory,
	workflowFormData,
	deleteExistingWorkflow,
	executeExistingWorkflow,
	setWorkflowActive,
	setWorkflowExecType,
} = useStore()
const { isEdit, workDefalutNodeData, resetWorkflowData, workflowData, detectionRefresh } = useWorkflowViewStore()
const { handleError } = useError()
const { useFormSlot } = useFormHooks()

/**
 * @description 状态列
 * @param {string} key - 状态列的key
 * @returns {DataTableColumn<WorkflowHistoryItem>[]} 返回状态列配置数组
 */
const statusCol = <T,>(key: string, title: string): TableColumn<T> => ({
	title,
	key,
	width: 100,
	render: (row: T) => {
		const statusMap: Record<string, { type: string; text: string }> = {
			success: { type: 'success', text: $t('t_8_1745227838023') },
			fail: { type: 'error', text: $t('t_9_1745227838305') },
			running: { type: 'warning', text: $t('t_0_1746519384035') },
		}
		const status = statusMap[row[key] as keyof Record<string, unknown>] || {
			type: 'default',
			text: $t('t_1_1746773348701'),
		}
		return (
			<NTag type={status.type as any} size="small">
				{status.text}
			</NTag>
		)
	},
})

/**
 * @description 工作流业务逻辑控制器
 * @function useController
 */
export const useController = () => {
	// 获取当前路由
	const route = useRoute()
	// 获取路由实例
	const router = useRouter()

	// 判断是否为子路由
	const hasChildRoutes = computed(() => route.path !== '/auto-deploy')

	/**
	 * @description 创建表格列配置
	 * @returns {DataTableColumn<WorkflowItem>[]} 返回表格列配置数组
	 */
	const createColumns = (): DataTableColumn<WorkflowItem>[] => [
		{
			title: $t('t_0_1745215914686'),
			key: 'name',
			width: 200,
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: $t('t_1_1746590060448'),
			key: 'type',
			width: 100,
			render: (row: WorkflowItem) => (
				<NSpace>
					<NSwitch
						size="small"
						v-model:value={row.exec_type}
						onUpdate:value={() => {
							handleSetWorkflowExecType(row)
						}}
						checkedValue={'auto'}
						uncheckedValue={'manual'}
					/>
					<span>{row.exec_type === 'auto' ? $t('t_2_1745215915397') : $t('t_3_1745215914237')}</span>
				</NSpace>
			),
		},
		// {
		// 	title: $t('t_4_1745215914951'),
		// 	key: 'active',
		// 	width: 100,
		// 	render: (row: WorkflowItem) => (
		// 		<NSwitch
		// 			size="small"
		// 			v-model:value={row.active}
		// 			onUpdate:value={() => {
		// 				handleChangeActive(row)
		// 			}}
		// 			checkedValue={1}
		// 			uncheckedValue={0}
		// 			checked-text={$t('t_0_1745457486299')}
		// 			unchecked-text={$t('t_1_1745457484314')}
		// 		/>
		// 	),
		// },
		{
			title: $t('t_7_1745215914189'),
			key: 'created_at',
			width: 180,
			render: (row: WorkflowItem) => row.create_time || '-',
		},
		statusCol<WorkflowItem>('last_run_status', $t('t_0_1746677882486')),
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			fixed: 'right',
			align: 'right',
			width: 220,
			render: (row: WorkflowItem) => (
				<NSpace justify="end">
					<NButton
						style={{ '--n-text-color': 'var(--text-color-3)' }}
						size="tiny"
						strong
						secondary
						onClick={() => handleViewHistory(row)}
					>
						{$t('t_9_1745215914666')}
					</NButton>
					<NButton size="tiny" strong secondary type="info" onClick={() => handleExecuteWorkflow(row)}>
						{$t('t_10_1745215914342')}
					</NButton>
					<NButton size="tiny" strong secondary type="primary" onClick={() => handleEditWorkflow(row)}>
						{$t('t_11_1745215915429')}
					</NButton>
					<NButton size="tiny" strong secondary type="error" onClick={() => handleDeleteWorkflow(row)}>
						{$t('t_12_1745215914312')}
					</NButton>
				</NSpace>
			),
		},
	]

	// 表格实例
	const {
		component: WorkflowTable,
		loading,
		param,
		data,
		total,
		fetch,
	} = useTable<WorkflowItem, WorkflowListParams>({
		config: createColumns(),
		request: fetchWorkflowList,
		defaultValue: {
			p: 1,
			limit: 10,
			search: '',
		},
		watchValue: ['p', 'limit'],
	})

	// 分页实例
	const { component: WorkflowTablePage } = useTablePage({
		param,
		total,
		alias: {
			page: 'p',
			pageSize: 'limit',
		},
	})

	/**
	 * @description 打开添加工作流弹窗
	 */
	const handleAddWorkflow = () => {
		detectionRefresh.value = true
		useModal({
			title: $t('t_5_1746667590676'),
			component: AddWorkflowModal,
			footer: true,
			area: 500,
			onUpdateShow(show) {
				if (!show) fetch()
			},
		})
	}

	/**
	 * @description 查看工作流执行历史
	 * @param {number} workflowId - 工作流ID
	 */
	const handleViewHistory = async (workflow: WorkflowItem) => {
		useModal({
			title: workflow ? `${workflow.name} - ${$t('t_9_1745215914666')}` : $t('t_9_1745215914666'),
			component: HistoryModal,
			area: 800,
			componentProps: { id: workflow.id },
		})
	}

	/**
	 * @description 执行工作流
	 * @param {WorkflowItem} workflow - 工作流对象
	 */
	const handleExecuteWorkflow = async ({ name, id }: WorkflowItem) => {
		useDialog({
			title: $t('t_13_1745215915455'),
			content: $t('t_2_1745227839794', { name }),
			onPositiveClick: async () => {
				await executeExistingWorkflow(id)
				await fetch()
			},
		})
	}

	/**
	 * @description 设置工作流运行方式
	 * @param {WorkflowItem} workflow - 工作流对象
	 */
	const handleSetWorkflowExecType = ({ id, exec_type }: WorkflowItem) => {
		useDialog({
			title: exec_type === 'manual' ? $t('t_2_1745457488661') : $t('t_3_1745457486983'),
			content: exec_type === 'manual' ? $t('t_4_1745457497303') : $t('t_5_1745457494695'),
			onPositiveClick: () => setWorkflowExecType({ id, exec_type }),
			onNegativeClick: fetch,
			onClose: fetch,
		})
	}

	/**
	 * @description 切换工作流状态
	 * @param active - 工作流状态
	 */
	const handleChangeActive = ({ id, active }: WorkflowItem) => {
		useDialog({
			title: !active ? $t('t_6_1745457487560') : $t('t_7_1745457487185'),
			content: !active ? $t('t_8_1745457496621') : $t('t_9_1745457500045'),
			onPositiveClick: () => setWorkflowActive({ id, active }),
			onNegativeClick: fetch,
			onClose: fetch,
		})
	}

	/**
	 * @description 编辑工作流
	 * @param {WorkflowItem} workflow - 工作流对象
	 * @todo 实现工作流编辑功能
	 */
	const handleEditWorkflow = (workflow: WorkflowItem) => {
		const content = JSON.parse(workflow.content)
		isEdit.value = true
		workflowData.value = {
			id: workflow.id,
			name: workflow.name,
			content: content,
			exec_type: workflow.exec_type,
			active: workflow.active,
		}
		workDefalutNodeData.value = {
			id: workflow.id,
			name: workflow.name,
			childNode: content,
		}
		detectionRefresh.value = true
		router.push(`/auto-deploy/workflow-view?isEdit=true`)
	}

	/**
	 * @description 删除工作流
	 * @param {WorkflowItem} workflow - 工作流对象
	 */
	const handleDeleteWorkflow = (workflow: WorkflowItem) => {
		useDialog({
			title: $t('t_16_1745215915209'),
			content: $t('t_3_1745227841567', { name: workflow.name }),
			onPositiveClick: async () => {
				await deleteExistingWorkflow(workflow.id)
				await fetch()
			},
		})
	}

	/**
	 * @description 检测是否需要添加工作流
	 */
	const isDetectionAddWorkflow = () => {
		const { type } = route.query
		if (type?.includes('create')) {
			handleAddWorkflow()
			router.push({ query: {} })
		}
	}

	return {
		WorkflowTable,
		WorkflowTablePage,
		isDetectionAddWorkflow,
		handleViewHistory, // 查看工作流执行历史
		handleAddWorkflow, // 打开添加工作流弹窗
		handleChangeActive, // 切换工作流状态
		handleSetWorkflowExecType, // 设置工作流运行方式
		handleExecuteWorkflow, // 执行工作流
		handleEditWorkflow, // 编辑工作流
		handleDeleteWorkflow, // 删除工作流
		hasChildRoutes,
		fetch,
		data,
		loading,
		param,
	}
}

/**
 * @description 添加工作流业务逻辑控制器
 * @returns {Object} 返回添加工作流业务逻辑控制器实例
 */
export const useAddWorkflowController = () => {
	const { confirm } = useModalHooks()
	// 表单配置
	const config = computed(() => [useFormSlot('template')])

	// 表单实例
	const { component: AddWorkflowForm, data } = useForm({
		config,
		rules: {},
		defaultValue: workflowFormData,
	})

	// 确认添加工作流
	confirm(async (close) => {
		try {
			close()
			resetWorkflowData()
			router.push(`/auto-deploy/workflow-view?type=${data.value.templateType}`)
		} catch (error) {
			handleError(error)
		}
	})
	return { AddWorkflowForm }
}

/**
 * @description 工作流历史记录业务逻辑控制器
 * @param {number} workflowId - 工作流ID
 * @returns {Object} 返回工作流历史记录业务逻辑控制器实例
 */
export const useHistoryController = (id: string) => {
	/**
	 * @description 工作流历史详情
	 * @param {number} workflowId - 工作流ID
	 */
	const handleViewHistoryDetail = async (workflowId: string) => {
		useModal({
			title: $t('t_0_1746579648713'),
			component: HistoryLogsModal,
			area: 730,
			componentProps: { id: workflowId },
		})
	}

	/**
	 * @description 创建历史记录表格列配置
	 * @returns {DataTableColumn<WorkflowHistoryItem>[]} 返回表格列配置数组
	 */
	const createColumns = (): DataTableColumn<WorkflowHistoryItem>[] => [
		{
			title: $t('t_4_1745227838558'),
			key: 'create_time',
			width: 230,
			render: (row: WorkflowHistoryItem) => {
				// 处理数字类型的时间戳
				return row.create_time ? row.create_time : '-'
			},
		},
		{
			title: $t('t_5_1745227839906'),
			key: 'end_time',
			width: 230,
			render: (row: WorkflowHistoryItem) => {
				// 处理数字类型的时间戳
				return row.end_time ? row.end_time : '-'
			},
		},
		{
			title: $t('t_6_1745227838798'),
			key: 'exec_type',
			width: 110,
			render: (row: WorkflowHistoryItem) => (
				<NTag type={row.exec_type === 'auto' ? 'info' : 'default'} size="small" bordered={false}>
					{row.exec_type === 'auto' ? $t('t_2_1745215915397') : $t('t_3_1745215914237')}
				</NTag>
			),
		},
		statusCol<WorkflowHistoryItem>('status', $t('t_7_1745227838093')),
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			fixed: 'right',
			align: 'right',
			width: 80,
			render: (row: WorkflowHistoryItem) => (
				<NSpace justify="end">
					<NButton
						size="tiny"
						strong
						secondary
						type="primary"
						onClick={() => handleViewHistoryDetail(row.id.toString())}
					>
						{$t('t_12_1745227838814')}
					</NButton>
				</NSpace>
			),
		},
	]

	// 表格实例
	const {
		component: WorkflowHistoryTable,
		loading,
		param,
		data,
		total,
		fetch,
	} = useTable<WorkflowHistoryItem, WorkflowHistoryParams>({
		config: createColumns(),
		request: fetchWorkflowHistory,
		defaultValue: {
			id,
			p: 1,
			limit: 10,
		},
		watchValue: ['p', 'limit'],
	})

	const { component: WorkflowHistoryTablePage } = useTablePage({
		param,
		total,
		alias: {
			page: 'p',
			pageSize: 'limit',
		},
	})

	return {
		WorkflowHistoryTable,
		WorkflowHistoryTablePage,
		loading,
		param,
		data,
		total,
		fetch,
	}
}
