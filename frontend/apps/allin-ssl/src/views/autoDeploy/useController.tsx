import { NSwitch, NTag, NButton, NSpace, NFlex, NText, NFormItem, NSelect } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@autoDeploy/useStore'
import {
	useDialog,
	useTable,
	useModal,
	useFormHooks,
	useForm,
	useModalHooks,
	useMessage,
	useSearch,
} from '@baota/naive-ui/hooks'
import { useStore as useWorkflowViewStore } from '@autoDeploy/children/workflowView/useStore'
import { useError } from '@baota/hooks/error'
import AddWorkflowModal from './components/WorkflowModal'
import HistoryModal from './components/HistoryModal'
import HistoryLogsModal from './components/historyLogsModal'
import CAManageModal from './components/CAManageModal'
import { $t } from '@/locales'
import { router } from '@router/index'
import { CACertificateAuthorization } from '@config/data'
import SvgIcon from '@components/SvgIcon'
import { isEmail } from '@baota/utils/business'

import type { WorkflowItem, WorkflowListParams, WorkflowHistoryParams, WorkflowHistoryItem } from '@/types/workflow'
import type { DataTableColumn } from 'naive-ui'
import type { TableColumn } from 'naive-ui/es/data-table/src/interface'
import type { EabItem, EabListParams } from '@/types/access'

const {
	refreshTable,
	fetchWorkflowList,
	fetchWorkflowHistory,
	workflowFormData,
	deleteExistingWorkflow,
	executeExistingWorkflow,
	stopExistingWorkflow,
	setWorkflowActive,
	setWorkflowExecType,
	caFormData,
	fetchEabList,
	addNewEab,
	updateExistingEab,
	deleteExistingEab,
	resetCaForm,
} = useStore()
const { isEdit, workDefalutNodeData, resetWorkflowData, workflowData, detectionRefresh } = useWorkflowViewStore()
const { handleError } = useError()
const { useFormSlot } = useFormHooks()

/**
 * @description 状态列
 * @param {string} key - 状态列的key
 * @returns {DataTableColumn<WorkflowHistoryItem>[]} 返回状态列配置数组
 */
const statusCol = <T extends Record<string, any>>(key: string, title: string): TableColumn<T> => ({
	title,
	key,
	width: 100,
	render: (row: T) => {
		const statusMap: Record<string, { type: string; text: string }> = {
			success: { type: 'success', text: $t('t_0_1747895713179') },
			fail: { type: 'error', text: $t('t_4_1746773348957') },
			running: { type: 'warning', text: $t('t_1_1747895712756') },
		}
		const status = statusMap[row[key] as string] || {
			type: 'default',
			text: $t('t_1_1746773348701'),
		}
		if (row[key] === 'running') refreshTable.value = true
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
		{
			title: $t('t_7_1745215914189'),
			key: 'created_at',
			width: 180,
			render: (row: WorkflowItem) => row.create_time || '-',
		},
		{
			title: $t('t_1_1750129254278'),
			key: 'last_run_time',
			width: 180,
			render: (row: WorkflowItem) => row.last_run_time || '-',
		},
		statusCol<WorkflowItem>('last_run_status', $t('t_2_1750129253921')),
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			fixed: 'right',
			align: 'right',
			width: 220,
			render: (row: WorkflowItem) => (
				<NSpace justify="end">
					<NButton size="tiny" strong secondary type="primary" onClick={() => handleViewHistory(row)}>
						{$t('t_9_1745215914666')}
					</NButton>
					<NButton size="tiny" strong secondary type="primary" onClick={() => handleExecuteWorkflow(row)}>
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
	const { TableComponent, PageComponent, loading, param, fetch } = useTable<WorkflowItem, WorkflowListParams>({
		config: createColumns(),
		request: fetchWorkflowList,
		storage: 'autoDeployPageSize',
		defaultValue: { p: 1, limit: 10, search: '' },
		alias: { page: 'p', pageSize: 'limit' },
		watchValue: ['p', 'limit'],
	})

	// 搜索实例
	const { SearchComponent } = useSearch({
		onSearch: (value) => {
			param.value.search = value
			fetch()
		},
	})

	// 节流渲染
	const throttleFn = useThrottleFn(() => {
		setTimeout(() => {
			fetch()
			refreshTable.value = false
		}, 1000)
	}, 100)

	watch(
		() => refreshTable.value,
		(val) => {
			if (val) throttleFn()
		},
	)

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
			title: workflow ? `【${workflow.name}】 - ${$t('t_9_1745215914666')}` : $t('t_9_1745215914666'),
			component: HistoryModal,
			area: 850,
			componentProps: { id: workflow.id.toString() },
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
			onNegativeClick: () => fetch(),
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
			onNegativeClick: () => fetch(),
			onClose: () => fetch(),
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

	/**
	 * @description 检测是否需要打开CA授权管理弹窗
	 */
	const isDetectionOpenCAManage = () => {
		const { type } = route.query
		if (type?.includes('caManage')) {
			handleOpenCAManage()
			router.push({ query: {} })
		}
	}

	/**
	 * @description 检测是否需要打开添加CA授权弹窗
	 */
	const isDetectionOpenAddCAForm = () => {
		const { type } = route.query
		if (type?.includes('addCAForm')) {
			handleOpenCAManage({ type: 'addCAForm' })
			router.push({ query: {} })
		}
	}

	/**
	 * @description 打开CA授权管理弹窗
	 */
	const handleOpenCAManage = ({ type }: { type: string } = { type: '' }) => {
		useModal({
			title: $t('t_0_1747903670020'),
			component: CAManageModal,
			componentProps: { type },
			area: 780,
		})
	}

	return {
		TableComponent,
		PageComponent,
		SearchComponent,
		isDetectionAddWorkflow, // 检测是否需要添加工作流
		isDetectionOpenCAManage, // 检测是否需要打开CA授权管理弹窗
		isDetectionOpenAddCAForm, // 检测是否需要打开添加CA授权弹窗
		handleViewHistory, // 查看工作流执行历史
		handleAddWorkflow, // 打开添加工作流弹窗
		handleChangeActive, // 切换工作流状态
		handleSetWorkflowExecType, // 设置工作流运行方式
		handleExecuteWorkflow, // 执行工作流
		handleEditWorkflow, // 编辑工作流
		handleDeleteWorkflow, // 删除工作流
		handleOpenCAManage, // 打开CA授权管理弹窗
		hasChildRoutes,
		fetch,
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
	 * @description 停止工作流执行
	 * @param {WorkflowHistoryItem} historyItem - 工作流历史记录项
	 */
	const handleStopWorkflow = async (historyItem: WorkflowHistoryItem) => {
		useDialog({
			title: $t('t_0_1749204565782'),
			content: $t('t_1_1749204570473'),
			onPositiveClick: async () => {
				await stopExistingWorkflow(historyItem.id)
				await fetch() // 刷新历史记录表格
				// 触发外部主表格刷新
				refreshTable.value = true
			},
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
			width: 200,
			render: (row: WorkflowHistoryItem) => {
				// 处理数字类型的时间戳
				return row.create_time ? row.create_time : '-'
			},
		},
		{
			title: $t('t_5_1745227839906'),
			key: 'end_time',
			width: 200,
			render: (row: WorkflowHistoryItem) => {
				// 处理数字类型的时间戳
				return row.end_time ? row.end_time : '-'
			},
		},
		{
			title: $t('t_6_1745227838798'),
			key: 'exec_type',
			width: 120,
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
			width: 180,
			render: (row: WorkflowHistoryItem) => (
				<NSpace justify="end" size="small">
					{row.status === 'running' && (
						<NButton size="tiny" strong secondary type="error" onClick={() => handleStopWorkflow(row)}>
							{$t('t_0_1749204565782')}
						</NButton>
					)}
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
	const { TableComponent, PageComponent, loading, fetch } = useTable<WorkflowHistoryItem, WorkflowHistoryParams>({
		config: createColumns(),
		request: fetchWorkflowHistory,
		defaultValue: { id, p: 1, limit: 10 },
		alias: { page: 'p', pageSize: 'limit' },
		watchValue: ['p', 'limit'],
		storage: 'autoDeployHistoryPageSize',
	})

	return {
		TableComponent,
		PageComponent,
		loading,
		fetch,
	}
}

/**
 * @description 处理CA授权类型
 * @param type - CA授权类型
 * @returns 返回CA授权类型名称
 */
const handleCertAuth = (type: string) => {
	// console.log(type)
	try {
		const name = type.replaceAll('.', '').replaceAll("'", '').replaceAll(' ', '').toLowerCase() // 处理类型中的特殊字符
		const caType = CACertificateAuthorization[name as keyof typeof CACertificateAuthorization].type
		return { type: caType, icon: type }
	} catch (error) {
		return { type, icon: 'custom' }
	}
}

/**
 * @description CA授权管理业务逻辑控制器
 * @returns {Object} 返回CA授权管理控制器对象
 */
export const useCAManageController = (props: { type: string }) => {
	const { handleError } = useError()
	// 表格配置
	const columns: DataTableColumn<EabItem>[] = [
		{
			title: $t('t_1_1745735764953'),
			key: 'email',
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: $t('t_9_1747903669360'),
			key: 'ca',
			width: 200,
			render: (row: EabItem) => {
				const { type, icon } = handleCertAuth(row.ca)
				return (
					<NFlex align="center">
						<SvgIcon icon={`cert-${icon}`} size="2rem" />
						<NText>{type}</NText>
					</NFlex>
				)
			},
		},
		{
			title: $t('t_7_1745215914189'),
			key: 'create_time',
			width: 180,
			render: (row: EabItem) => (row.create_time ? row.create_time : '--'),
		},
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			width: 120,
			align: 'right' as const,
			fixed: 'right' as const,
			render: (row: EabItem) => (
				<NSpace justify="end">
					<NButton size="tiny" strong secondary type="primary" onClick={() => handleEdit(row)}>
						{$t('t_11_1745215915429')}
					</NButton>
					<NButton size="tiny" strong secondary type="error" onClick={() => confirmDelete(row.id.toString())}>
						{$t('t_12_1745215914312')}
					</NButton>
				</NSpace>
			),
		},
	]

	// 表格实例
	const { TableComponent, PageComponent, loading, param, total, fetch } = useTable<EabItem, EabListParams>({
		config: columns,
		request: fetchEabList,
		defaultValue: { p: 1, limit: 10 },
		alias: { page: 'p', pageSize: 'limit' },
		watchValue: ['p', 'limit'],
		storage: 'caManagePageSize',
	})

	// // 分页实例
	// const { component: CATablePage } = useTablePage({
	// 	param,
	// 	total,
	// 	alias: {
	// 		page: 'p',
	// 		pageSize: 'limit',
	// 	},
	// })

	/**
	 * 确认删除CA授权
	 * @param {string} id - CA授权ID
	 */
	const confirmDelete = (id: string) => {
		useDialog({
			title: $t('t_2_1747903672640'),
			content: $t('t_3_1747903672833'),
			onPositiveClick: async () => {
				try {
					await deleteExistingEab(id)
					await fetch()
				} catch (error) {
					handleError(error)
				}
			},
		})
	}

	/**
	 * 编辑CA授权
	 * @param {EabItem} row - CA授权数据
	 */
	const handleEdit = (row: EabItem) => {
		const caTypes = Object.values(CACertificateAuthorization).map((item) => item.type)
		const isCustomCa = !caTypes.includes(row.ca)

		// 填充表单数据 - 添加编辑模式标识
		Object.assign(caFormData.value, {
			email: row.email,
			ca: isCustomCa ? 'custom' : row.ca,
			caName: isCustomCa ? row.ca : '',
			Kid: row.Kid || '',
			HmacEncoded: row.HmacEncoded || '',
			CADirURL: row.CADirURL || '',
		})
		useModal({
			title: $t('t_3_1750129254533'),
			area: 500,
			component: () => import('./components/CAManageForm').then((m) => m.default),
			footer: true,
			componentProps: { isEdit: true, editId: row.id.toString() },
			onUpdateShow: (show) => {
				if (!show) fetch()
			},
		})
	}

	/**
	 * 打开添加CA授权表单
	 */
	const handleOpenAddForm = () => {
		resetCaForm()
		useModal({
			title: $t('t_4_1747903685371'),
			area: 500,
			component: () => import('./components/CAManageForm').then((m) => m.default),
			footer: true,
			onUpdateShow: (show) => {
				if (!show) fetch()
			},
		})
	}

	// 挂载时获取数据
	onMounted(() => {
		fetch()
		if (props.type === 'addCAForm') handleOpenAddForm()
	})

	return {
		TableComponent,
		PageComponent,
		loading,
		param,
		total,
		fetch,
		handleOpenAddForm,
		handleEdit,
	}
}

/**
 * @description CA授权表单控制器
 * @returns {Object} 返回CA授权表单控制器对象
 */
export const useCAFormController = (props?: { isEdit?: boolean; editId?: string }) => {
	const { handleError } = useError()
	const { confirm } = useModalHooks()
	const { useFormInput, useFormCustom } = useFormHooks()

	// 动态验证规则
	const getFormRules = () => {
		const rules: any = {
			email: {
				required: true,
				message: $t('t_6_1747817644358'),
				trigger: ['blur', 'input'],
				validator: (rule: any, value: string) => {
					if (!value) return new Error($t('t_6_1747817644358'))
					if (!isEmail(value)) {
						return new Error($t('t_7_1747817613773'))
					}
					return true
				},
			},
			ca: {
				required: true,
				message: $t('t_7_1747903678624'),
				trigger: 'change',
			},
		}

		const currentCa = caFormData.value.ca

		// SSL.com 和 Google 必填 EAB 参数
		if (currentCa === 'sslcom' || currentCa === 'google') {
			rules.Kid = {
				required: true,
				message: $t('t_5_1747903671439'),
				trigger: ['blur', 'input'],
			}
			rules.HmacEncoded = {
				required: true,
				message: $t('t_6_1747903672931'),
				trigger: ['blur', 'input'],
			}
		}

		// 自定义类型必填 CADirURL
		if (currentCa === 'custom') {
			rules.caName = {
				required: true,
				message: '请输入CA名称',
				trigger: ['blur', 'input'],
			}
			rules.CADirURL = {
				required: true,
				trigger: ['blur', 'input'],
				validator: (rule: any, value: string) => {
					if (!value) {
						return new Error('请输入CA目录URL')
					}
					// Basic URL validation
					try {
						new URL(value)
						return true
					} catch (e) {
						return new Error('请输入有效的URL地址')
					}
				},
			}
		}

		return rules
	}

	// 渲染标签函数
	const renderLabel = (option: { value: string; label: string }): VNode => {
		return (
			<NFlex align="center" size="small">
				<SvgIcon icon={`cert-${option.value}`} size="2rem" />
				<NText>{option.label}</NText>
			</NFlex>
		)
	}

	// 渲染单选标签函数
	const renderSingleSelectTag = ({ option }: Record<string, any>): VNode => {
		return (
			<NFlex class="w-full">
				{option.label ? (
					renderLabel(option)
				) : (
					<span class="text-[1.4rem] text-gray-400">{$t('t_7_1747903678624')}</span>
				)}
			</NFlex>
		)
	}

	// 获取CA提供商选项
	const caOptions = Object.values(CACertificateAuthorization).map((item) => ({
		label: item.name,
		value: item.type,
	}))

	// 判断是否显示EAB字段
	const shouldShowEab = computed(() => {
		const ca = caFormData.value.ca
		// Buypass和Letsencrypt不显示EAB字段
		return ca !== 'buypass' && ca !== 'letsencrypt'
	})

	// 判断是否显示CADirURL字段
	const shouldShowCADirURL = computed(() => {
		return caFormData.value.ca === 'custom'
	})

	// 判断是否显示必填标记
	const shouldShowRequireMark = computed(() => {
		const ca = caFormData.value.ca
		return ca !== 'zerossl' && ca !== 'custom'
	})

	// 表单配置
	const formConfig = computed(() => [
		useFormCustom(() => {
			return (
				<NFormItem label={$t('t_9_1747903669360')} path="ca">
					<NSelect
						class="w-full"
						options={caOptions}
						renderLabel={renderLabel}
						renderTag={renderSingleSelectTag}
						filterable
						placeholder={$t('t_7_1747903678624')}
						v-model:value={caFormData.value.ca}
						v-slots={{
							empty: () => {
								return <span class="text-[1.4rem]">{$t('t_7_1747903678624')}</span>
							},
						}}
					/>
				</NFormItem>
			)
		}),
		useFormInput($t('t_1_1745735764953'), 'email', {
			placeholder: $t('t_0_1747965909665'),
		}),
		// 条件显示CADirURL字段
		...(shouldShowCADirURL.value
			? [
					useFormInput('CA名称', 'caName', {
						placeholder: '请输入CA提供商名称',
					}),
					useFormInput($t('t_0_1750399513983'), 'CADirURL', {
						placeholder: $t('t_1_1750399516161'),
					}),
				]
			: []),
		// 条件显示EAB字段
		...(shouldShowEab.value
			? [
					useFormInput(
						$t('t_10_1747903662994'),
						'Kid',
						{
							placeholder: $t('t_11_1747903674802'),
						},
						{ showRequireMark: shouldShowRequireMark.value },
					),
					useFormInput(
						$t('t_12_1747903662994'),
						'HmacEncoded',
						{
							type: 'textarea',
							placeholder: $t('t_13_1747903673007'),
							rows: 3,
						},
						{ showRequireMark: shouldShowRequireMark.value },
					),
				]
			: []),
	])

	// 提交表单
	const submitForm = async (formData: any) => {
		try {
			const dataToSubmit = { ...formData }
			if (dataToSubmit.ca === 'custom') {
				dataToSubmit.ca = dataToSubmit.caName
			}
			delete dataToSubmit.caName // 删除临时字段
			if (props?.isEdit && props?.editId) {
				// 编辑模式
				await updateExistingEab({ ...dataToSubmit, id: props.editId })
			} else {
				// 新增模式
				await addNewEab(dataToSubmit)
			}
			return true
		} catch (error) {
			handleError(error)
			return false
		}
	}

	// 表单实例
	const { component: CAForm, fetch } = useForm({
		config: formConfig,
		rules: getFormRules(),
		defaultValue: caFormData,
		request: submitForm,
	})

	// 确认提交表单
	confirm(async (close) => {
		try {
			await fetch()
			close()
		} catch (error) {
			handleError(error)
		}
	})

	return {
		CAForm,
	}
}
