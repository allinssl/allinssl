import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FormRules, NButton, NSpace, NSwitch, NText, NDivider, type DataTableColumns } from 'naive-ui'

// 钩子和工具
import {
	useModal,
	useTable,
	useDialog,
	useModalHooks,
	useForm,
	useFormHooks,
	useLoadingMask,
	useSearch,
} from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { isDomain, isPort, isIp } from '@baota/utils/business'
import { $t } from '@locales/index'

// Store和组件
import { useStore } from './useStore'
import MonitorForm from './components/AddMonitorModel'
import ImportMonitorModal from './components/ImportMonitorModal'
import NotifyProviderMultiSelect from '@components/notifyProviderMultiSelect'
import TypeIcon from '@components/TypeIcon'

// 类型导入
import type { Ref, ComputedRef } from 'vue'
import type {
	AddSiteMonitorParams,
	SiteMonitorItem,
	SiteMonitorListParams,
	UpdateSiteMonitorParams,
} from '@/types/monitor'

/**
 * 监控管理控制器接口定义
 */
interface MonitorControllerExposes {
	// 表格相关
	TableComponent: ReturnType<typeof useTable>['TableComponent']
	PageComponent: ReturnType<typeof useTable>['PageComponent']
	ColumnSettingsComponent: ReturnType<typeof useTable>['ColumnSettingsComponent']
	SearchComponent: ReturnType<typeof useSearch>['SearchComponent']
	loading: Ref<boolean>
	// param: Ref<SiteMonitorListParams>
	// data: Ref<{ list: SiteMonitorItem[]; total: number }>
	fetch: () => Promise<void>

	// 表单和操作相关
	openAddForm: () => void
	openImportForm: () => void
	openDetailPage: (row: SiteMonitorItem) => void
	isDetectionAddMonitor: () => void

	// 路由相关
	hasChildRoutes: ComputedRef<boolean>
}

// 从Store中获取方法
const {
	fetchMonitorList,
	deleteExistingMonitor,
	setMonitorStatus,
	monitorForm,
	addNewMonitor,
	updateExistingMonitor,
	resetMonitorForm,
	updateMonitorForm,
} = useStore()

// 错误处理
const { handleError } = useError()

/**
 * 验证域名（或IP）+端口格式
 * @param value - 要验证的值
 * @returns {boolean} 如果是有效的域名、IP地址或它们加端口的格式，则返回 true
 */
const isDomainWithPort = (value: string): boolean => {
	if (!value) return false

	// 检查是否包含端口号
	const parts = value.split(':')

	if (parts.length === 1) {
		// 只有域名或IP，验证域名或IP地址
		return isDomain(value) || isIp(value)
	} else if (parts.length === 2) {
		// 域名/IP+端口格式
		const [host, port] = parts
		if (!host || !port) return false
		return (isDomain(host) || isIp(host)) && isPort(port)
	}

	// 超过一个冒号，格式不正确（IPv6除外，但这里暂不处理IPv6+端口的复杂情况）
	return false
}

/**
 * 监控管理业务逻辑控制器
 * @description 处理监控列表页面的业务逻辑，包括表格展示、添加、编辑、删除等操作
 * @returns {MonitorControllerExposes} 返回controller对象
 */
export const useController = (): MonitorControllerExposes => {
	const route = useRoute()
	const router = useRouter()

	// 判断是否为子路由
	const hasChildRoutes = computed(() => route.path !== '/monitor')

	/**
	 * 创建表格列配置
	 * @description 定义监控表格的列结构和渲染方式
	 * @returns {DataTableColumns<SiteMonitorItem>} 返回表格列配置数组
	 */
	const createColumns = (): DataTableColumns<SiteMonitorItem> => [
		{
			title: $t('t_13_1745289354528'),
			key: 'name',
			width: 150,
		},
		{
			title: $t('t_17_1745227838561'),
			key: 'target',
			width: 180,
			render: (row: SiteMonitorItem) => {
				return (
					<a
						href={`https://${row.target}`}
						target="_blank"
						rel="noopener noreferrer"
						style="color: var(--primary-color); text-decoration: none;"
					>
						{row.target}
					</a>
				)
			},
		},
		{
			title: $t('t_14_1745289354902'),
			key: 'common_name',
			width: 180,
			render: (row: SiteMonitorItem) => {
				return row.common_name || '-'
			},
		},
		{
			title: $t('t_15_1745289355714'),
			key: 'ca',
			width: 180,
		},
		{
			title: $t('t_16_1745289354902'),
			key: 'valid',
			width: 100,
			render: (row: SiteMonitorItem) => {
				return row.valid === 1 ? '有效' : '无效'
			},
		},
		{
			title: $t('t_17_1745289355715'),
			key: 'not_after',
			width: 150,
			render: (row: SiteMonitorItem) => {
				// 检查到期时间和剩余天数是否有效
				const hasValidNotAfter = row.not_after && row.not_after !== 'undefined' && row.not_after.trim() !== ''
				const hasValidDaysLeft = row.days_left !== undefined && row.days_left !== null && !isNaN(row.days_left)

				// 如果任一数据无效，显示占位符
				if (!hasValidNotAfter || !hasValidDaysLeft) {
					return '-'
				}

				// 正常情况下显示完整的到期时间信息
				return `${row.not_after}(${row.days_left}天)`
			},
		},
		{
			title: $t('t_2_1750399515511'),
			key: 'except_end_time',
			width: 150,
			render: (row: SiteMonitorItem) => row.except_end_time || '-',
		},
		{
			title: $t('t_19_1745289354676'),
			key: 'last_time',
			width: 150,
			render: (row: SiteMonitorItem) => row.last_time || '-',
		},
		{
			title: $t('t_0_1745295228865'),
			key: 'update_time',
			width: 150,
			render: (row: SiteMonitorItem) => row.update_time || '-',
		},
		{
			title: $t('t_18_1745289354598'),
			key: 'report_types',
			width: 200, // 增加宽度以适应多选标签
			render: (row: SiteMonitorItem) => {
				// 确保 report_types 数据格式正确处理
				let reportTypes: string | string[]

				if (typeof row.report_types === 'string') {
					// 如果是逗号分隔的字符串，转换为数组以支持多选显示
					reportTypes = row.report_types ? row.report_types.split(',').filter(Boolean) : []
				} else if (Array.isArray(row.report_types)) {
					// 如果已经是数组，直接使用
					reportTypes = row.report_types
				} else {
					// 其他情况，设为空数组
					reportTypes = []
				}

				// 如果没有通知类型，显示占位符
				if (!reportTypes || (Array.isArray(reportTypes) && reportTypes.length === 0)) {
					return <span style="color: var(--n-text-color-disabled); font-size: 12px;">-</span>
				}

				return <TypeIcon icon={reportTypes} />
			},
		},
		{
			title: $t('t_4_1745215914951'),
			key: 'active',
			width: 100,
			render: (row: SiteMonitorItem) => {
				return <NSwitch value={row.active === 1} onUpdateValue={() => toggleStatus(row)} />
			},
		},
		{
			title: $t('t_7_1745215914189'),
			key: 'create_time',
			width: 150,
		},
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			width: 200,
			fixed: 'right' as const,
			align: 'right',
			render: (row: SiteMonitorItem) => {
				return (
					<NSpace justify="end">
						<NButton size="tiny" strong secondary type="info" onClick={() => openDetailPage(row)}>
							详情
						</NButton>
						<NButton size="tiny" strong secondary type="primary" onClick={() => openEditForm(row)}>
							{$t('t_11_1745215915429')}
						</NButton>
						<NButton size="tiny" strong secondary type="error" onClick={() => confirmDelete(row)}>
							{$t('t_12_1745215914312')}
						</NButton>
					</NSpace>
				)
			},
		},
	]

	/**
	 * 表格实例
	 * @description 创建表格实例并管理相关状态
	 */
	const { TableComponent, PageComponent, ColumnSettingsComponent, loading, param, fetch } = useTable<
		SiteMonitorItem,
		SiteMonitorListParams
	>({
		config: createColumns(),
		request: fetchMonitorList,
		defaultValue: { p: 1, limit: 10, search: '' },
		alias: { page: 'p', pageSize: 'limit' },
		watchValue: ['p', 'limit'],
		storage: 'monitorColumnSettings',
	})

	// 搜索实例
	const { SearchComponent } = useSearch({
		onSearch: (value) => {
			param.value.search = value
			fetch()
		},
	})

	/**
	 * 打开添加监控弹窗
	 * @description 显示添加监控的表单弹窗
	 */
	const openAddForm = (): void => {
		useModal({
			title: $t('t_11_1745289354516'),
			area: 500,
			component: MonitorForm,
			footer: true,
			onUpdateShow(show) {
				if (!show) fetch()
			},
		})
	}

	/**
	 * 打开导入监控弹窗
	 * @description 显示导入监控的弹窗
	 */
	const openImportForm = (): void => {
		useModal({
			title: $t('t_0_1753000000001'),
			area: 600,
			component: ImportMonitorModal,
			footer: false,
			onUpdateShow(show) {
				if (!show) fetch()
			},
		})
	}

	/**
	 * 打开编辑监控弹窗
	 * @description 显示编辑监控的表单弹窗
	 * @param {SiteMonitorItem} data - 要编辑的监控项数据
	 */
	const openEditForm = (data: SiteMonitorItem): void => {
		useModal({
			title: $t('t_20_1745289354598'),
			area: 500,
			component: MonitorForm,
			componentProps: { isEdit: data.id, data },
			footer: true,
			onUpdateShow(show) {
				if (!show) fetch()
			},
		})
	}

	/**
	 * 打开监控详情页面
	 * @description 跳转到监控详情页面
	 * @param {SiteMonitorItem} row - 监控项数据
	 */
	const openDetailPage = (row: SiteMonitorItem): void => {
		router.push({
			path: '/monitor/detail',
			query: { id: row.id.toString() },
		})
	}

	/**
	 * 确认删除监控
	 * @description 显示删除确认对话框
	 * @param {SiteMonitorItem} row - 要删除的监控项
	 */
	const confirmDelete = (row: SiteMonitorItem): void => {
		useDialog({
			title: $t('t_0_1745294710530'),
			content: $t('t_22_1745289359036'),
			confirmText: $t('t_5_1744870862719'),
			cancelText: $t('t_4_1744870861589'),
			onPositiveClick: async () => {
				await deleteExistingMonitor(row)
				fetch()
			},
		})
	}

	/**
	 * 切换监控状态
	 * @description 启用或禁用监控
	 * @param {SiteMonitorItem} row - 监控项
	 */
	const toggleStatus = async (row: SiteMonitorItem): Promise<void> => {
		await setMonitorStatus({ id: row.id, active: Number(row.active) ? 0 : 1 })
		fetch()
	}

	/**
	 * 检测是否需要添加工作流
	 * @description 从URL参数判断是否需要自动打开添加表单
	 */
	const isDetectionAddMonitor = (): void => {
		const { type } = route.query
		if (type?.includes('create')) {
			openAddForm()
			router.push({ query: {} })
		}
	}

	return {
		// 表格相关
		TableComponent,
		PageComponent,
		ColumnSettingsComponent,
		SearchComponent,
		loading,
		fetch,
		// 表单和操作相关
		openAddForm,
		openImportForm,
		openDetailPage,
		isDetectionAddMonitor,
		// 路由相关
		hasChildRoutes,
	}
}

/**
 * 监控表单控制器接口定义
 */
interface MonitorFormControllerExposes {
	component: ReturnType<typeof useForm>['component']
}

/**
 * 监控表单控制器
 * @description 处理监控添加/编辑表单的业务逻辑
 * @param {UpdateSiteMonitorParams | null} data - 编辑时的初始数据
 * @returns {MonitorFormControllerExposes} 返回控制器对象
 */
export const useMonitorFormController = (data: UpdateSiteMonitorParams | null = null): MonitorFormControllerExposes => {
	// 表单工具
	const { useFormInput, useFormCustom, useFormInputNumber, useFormSelect, useFormSwitch } = useFormHooks()

	// 加载遮罩
	const { open: openLoad, close: closeLoad } = useLoadingMask({ text: '正在提交信息，请稍后...' })

	// 消息和对话框
	const { confirm } = useModalHooks()

	/**
	 * 创建分组标题
	 * @param title 分组标题文本
	 * @returns 分组标题配置
	 */
	const createGroupTitle = (title: string) => {
		return useFormCustom(() => <NDivider style="margin: 12px 0 8px 0; font-weight: 500;">{title}</NDivider>)
	}

	/**
	 * 表单配置
	 * @description 定义表单字段和布局
	 */
	const config = computed(() => [
		useFormInput('名称', 'name'),
		useFormInput('域名/IP地址', 'target'),
		useFormSelect('协议类型', 'monitor_type', [
			{ label: 'HTTPS', value: 'https' },
			{ label: 'SMTP', value: 'smtp' },
		]),
		useFormInputNumber('周期(分钟)', 'cycle', { class: 'w-full' }),
		useFormCustom(() => {
			// 确保 report_types 是数组格式
			const currentValue = Array.isArray(monitorForm.value.report_types)
				? monitorForm.value.report_types
				: monitorForm.value.report_types
					? typeof monitorForm.value.report_types === 'string'
						? monitorForm.value.report_types.split(',').filter(Boolean)
						: [monitorForm.value.report_types]
					: []

			return (
				<NotifyProviderMultiSelect
					path="report_types"
					isAddMode={true}
					value={currentValue}
					valueType="type"
					onUpdate:value={(items) => {
						// 将选中的多个值转换为数组格式，存储类型值
						monitorForm.value.report_types = items.map((item) => item.type || item.value)
					}}
				/>
			)
		}),
		// 到期提醒设置分组
		createGroupTitle('到期提醒设置'),
		useFormInputNumber('提前天数', 'advance_day', { class: 'w-full', min: 1, max: 365 }),
		useFormCustom(() => {
			const advanceDay = monitorForm.value.advance_day || 90
			return (
				<NText
					depth="3"
					style="font-size: 12px; margin-top: -8px; margin-bottom: 8px; display: block; color: var(--n-text-color-disabled);"
				>
					系统将在证书到期前 {advanceDay} 天开始发送提醒通知
				</NText>
			)
		}),
		// 连续失败通知设置分组
		createGroupTitle('连续失败通知设置'),
		useFormInputNumber('重复发送间隔(次数)', 'repeat_send_gap', { class: 'w-full', min: 1, max: 100 }),
		useFormSwitch('启用状态', 'active', {
			checkedValue: 1,
			uncheckedValue: 0,
		}),
	])

	/**
	 * 表单验证规则
	 */
	const rules = {
		name: { required: true, message: '请输入名称', trigger: 'input' },
		target: {
			required: true,
			message: '请输入正确的域名或IP地址',
			trigger: 'input',
			validator: (_rule: any, value: any, callback: any) => {
				if (!isDomainWithPort(value)) {
					callback(new Error('请输入正确的域名或IP地址（支持域名:端口或IP:端口格式）'))
				} else {
					callback()
				}
			},
		},
		monitor_type: { required: true, message: '请选择协议类型', trigger: 'change' },
		cycle: { required: true, message: '请输入周期', trigger: 'input', type: 'number', min: 1, max: 365 },
		report_types: {
			required: true,
			message: '请选择消息通知类型',
			trigger: 'change',
			validator: (_rule: any, value: any, callback: any) => {
				if (!value || (Array.isArray(value) && value.length === 0)) {
					callback(new Error('请至少选择一种消息通知类型'))
				} else {
					callback()
				}
			},
		},
		advance_day: { required: true, message: '请输入提前天数', trigger: 'input', type: 'number', min: 1, max: 365 },
		repeat_send_gap: {
			required: true,
			message: '请输入重复发送间隔',
			trigger: 'input',
			type: 'number',
			min: 1,
			max: 100,
		},
		active: { required: true, message: '请选择启用状态', trigger: 'change', type: 'number' },
	} as FormRules

	/**
	 * 表单提交处理
	 * @description 根据当前模式处理表单提交
	 * @param {AddSiteMonitorParams | UpdateSiteMonitorParams} params - 表单数据
	 */
	const request = async (params: AddSiteMonitorParams | UpdateSiteMonitorParams): Promise<void> => {
		try {
			if (data) {
				await updateExistingMonitor({ ...params, id: data.id } as UpdateSiteMonitorParams)
			} else {
				await addNewMonitor(params as AddSiteMonitorParams)
			}
		} catch (error) {
			handleError(error).default('添加失败')
		}
	}

	/**
	 * 使用表单hooks创建表单组件
	 */
	const { component, fetch } = useForm({
		config,
		defaultValue: monitorForm,
		request,
		rules,
	})

	/**
	 * 关联确认按钮
	 * @description 处理表单提交逻辑
	 */
	confirm(async (close) => {
		try {
			openLoad()
			await fetch()
			close()
		} catch (error) {
			return handleError(error)
		} finally {
			closeLoad()
		}
	})

	// 组件挂载时更新表单数据
	onMounted(() => {
		updateMonitorForm(data)
	})

	// 组件卸载时重置表单
	onUnmounted(resetMonitorForm)

	return {
		component,
	}
}
