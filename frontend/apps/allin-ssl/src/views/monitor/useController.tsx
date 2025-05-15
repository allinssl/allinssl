import { FormRules, NButton, NSpace, NSwitch, type DataTableColumns } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import {
	useModal,
	useTable,
	useTablePage,
	useDialog,
	useModalHooks,
	useForm,
	useFormHooks,
	useLoadingMask,
} from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { isDomain } from '@baota/utils/business'
import { $t } from '@locales/index'
import { useStore } from './useStore'
import MonitorForm from './components/monitorForm'
import NotifyProviderSelect from '@components/notifyProviderSelect'
import TypeIcon from '@components/typeIcon'

import type {
	AddSiteMonitorParams,
	SiteMonitorItem,
	SiteMonitorListParams,
	UpdateSiteMonitorParams,
} from '@/types/monitor'

// 消息和对话框
const {
	fetchMonitorList,
	deleteExistingMonitor,
	setMonitorStatus,
	monitorForm,
	addNewMonitor,
	updateMonitorForm,
	resetMonitorForm,
	updateExistingMonitor,
} = useStore()

// 错误处理
const { handleError } = useError()

/**
 * useController
 * @description 监控管理业务逻辑控制器
 * @returns {object} 返回controller对象
 */
export const useController = () => {
	const route = useRoute()
	const router = useRouter()
	/**
	 * @description 创建表格列配置
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
			key: 'site_domain',
			width: 180,
			render: (row: SiteMonitorItem) => {
				return (
					<NButton tag="a" text type="primary" href={`https://${row.site_domain}`} target="_blank">
						{row.site_domain}
					</NButton>
				)
			},
		},
		{
			title: $t('t_14_1745289354902'),
			key: 'cert_domain',
			width: 180,
			render: (row: SiteMonitorItem) => {
				return row.cert_domain || '-'
			},
		},
		{
			title: $t('t_15_1745289355714'),
			key: 'ca',
			width: 180,
		},
		{
			title: $t('t_16_1745289354902'),
			key: 'state',
			width: 100,
		},
		{
			title: $t('t_17_1745289355715'),
			key: 'end_time',
			width: 150,
			render: (row: SiteMonitorItem) => row.end_time + '(' + row.end_day + ')',
		},
		{
			title: $t('t_18_1745289354598'),
			key: 'report_type',
			width: 150,
			render: (row: SiteMonitorItem) => {
				return <TypeIcon icon={row.report_type} />
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
			title: $t('t_19_1745289354676'),
			key: 'update_time',
			width: 150,
			render: (row: SiteMonitorItem) => row.update_time || '-',
		},
		{
			title: $t('t_7_1745215914189'),
			key: 'create_time',
			width: 150,
		},
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			width: 150,
			fixed: 'right' as const,
			align: 'right',
			render: (row: SiteMonitorItem) => {
				return (
					<NSpace justify="end">
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

	// 表格实例
	const {
		component: MonitorTable,
		loading,
		param,
		data,
		total,
		fetch,
	} = useTable<SiteMonitorItem, SiteMonitorListParams>({
		config: createColumns(),
		request: fetchMonitorList,
		defaultValue: {
			p: 1,
			limit: 10,
			search: '',
		},
		watchValue: ['p', 'limit'],
	})

	// 分页实例
	const { component: MonitorTablePage } = useTablePage({
		param,
		total,
		alias: {
			page: 'p',
			pageSize: 'limit',
		},
	})

	/**
	 * @description 打开添加监控弹窗
	 */
	const openAddForm = () => {
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
	 * @description 打开编辑监控弹窗
	 * @param {SiteMonitorItem} item - 监控项
	 */
	const openEditForm = (data: SiteMonitorItem) => {
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
	 * @description 确认删除监控
	 * @param {number} id - 监控ID
	 */
	const confirmDelete = (row: SiteMonitorItem) => {
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
	 * @description 切换监控状态
	 * @param {ExtendedSiteMonitorItem} row - 监控项
	 */
	const toggleStatus = async (row: SiteMonitorItem) => {
		await setMonitorStatus({ id: row.id, active: Number(row.active) ? 0 : 1 })
		fetch()
	}

	/**
	 * @description 检测是否需要添加工作流
	 */
	const isDetectionAddMonitor = () => {
		const { type } = route.query
		if (type?.includes('create')) {
			openAddForm()
			router.push({ query: {} })
		}
	}

	return {
		loading,
		fetch,
		MonitorTable,
		MonitorTablePage,
		isDetectionAddMonitor,
		param,
		data,
		openAddForm,
	}
}

/**
 * @description 监控表单控制器
 * @returns {object} 返回controller对象
 */
export const useMonitorFormController = (data: UpdateSiteMonitorParams | null = null) => {
	// 消息和对话框
	const { useFormInput, useFormCustom, useFormInputNumber } = useFormHooks()

	// 加载遮罩
	const { open: openLoad, close: closeLoad } = useLoadingMask({ text: '正在提交信息，请稍后...' })

	// 消息和对话框
	const { confirm } = useModalHooks()

	// 表单配置
	const config = computed(() => [
		useFormInput('名称', 'name'),
		useFormInput('域名', 'domain'),
		useFormInputNumber('周期(分钟)', 'cycle', { class: 'w-full' }),
		useFormCustom(() => {
			return (
				<NotifyProviderSelect
					path="report_type"
					isAddMode={true}
					value={monitorForm.value.report_type}
					valueType="type"
					onUpdate:value={(item) => {
						console.log(item)
						monitorForm.value.report_type = item.value
					}}
				/>
			)
		}),
		// useFormSelect('类型', 'report_type', alarmList.value, { placeholder: '请选择类型，不能为空' }),
	])

	/**
	 * @description 表单验证规则
	 */
	const rules = {
		name: { required: true, message: '请输入名称', trigger: 'input' },
		domain: {
			required: true,
			message: '请输入正确的域名',
			trigger: 'input',
			validator: (rule: any, value: any, callback: any) => {
				if (!isDomain(value)) {
					callback(new Error('请输入正确的域名'))
				} else {
					callback()
				}
			},
		},
		cycle: { required: true, message: '请输入周期', trigger: 'input', type: 'number', min: 1, max: 365 },
		report_type: { required: true, message: '请选择消息通知类型', trigger: 'change' },
	} as FormRules

	/**
	 * @description 提交表单
	 * @param {AddSiteMonitorParams} params - 添加监控参数
	 * @param {Ref<FormInst | null>} formRef - 表单实例
	 */
	const request = async (params: AddSiteMonitorParams | UpdateSiteMonitorParams) => {
		try {
			if (data) {
				await updateExistingMonitor({ ...params, id: data.id })
			} else {
				const { id, ...rest } = params
				console.log(rest)
				await addNewMonitor(rest)
			}
		} catch (error) {
			handleError(error).default('添加失败')
		}
	}

	// 使用表单hooks
	const { component, fetch } = useForm({
		config,
		defaultValue: monitorForm,
		request,
		rules,
	})

	// 关联确认按钮
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

	onMounted(() => {
		updateMonitorForm(data) // 更新监控表单
	})

	onUnmounted(resetMonitorForm)

	return {
		component,
	}
}
