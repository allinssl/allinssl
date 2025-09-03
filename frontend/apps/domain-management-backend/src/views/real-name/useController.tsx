/**
 * 实名模板管理页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 * 使用统一的响应式数据源
 */

import { ref, computed, onMounted, defineComponent, type PropType } from 'vue'
import { NIcon, NInput, NButton, NTag, NSpace, NTooltip, NFlex, DataTableColumns, NCard } from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'
import { formatDate } from '@baota/utils/date'
import { useRealNameState, templateTypeOptions, templateStatusOptions, maskUtils,  } from './useStore'
import { useTable, useForm, useModal } from '@baota/naive-ui/hooks'
import { useMessage, useDialog } from '@baota/naive-ui/hooks'
import { useApp } from '@/components/layout/useStore'
import DomainRegistrationForm from './components/DomainRegistrationForm/index'
import { fetchContactDetail } from '@api/real-name'
import type { RealNameTemplate, FetchTemplatesRequest } from './types.d'

/**
 * 实名模板管理页面控制器
 */
export function useController() {
	const message = useMessage()

	// 获取状态管理
	const {
		// 状态
		templateTableParams,
		currentTemplate,
		openRealNameDialog,

		// 方法
		fetchTemplateList,
		deleteTemplateById,
		convertToFormData,
		setCurrentTemplate,

		// 映射工具
		getTemplateTypeText,
		getCertificateTypeText,
		getTemplateStatusText,
		getTemplateStatusType,
	} = useRealNameState()

	// 获取移动端状态
	const { isMobile } = useApp()

	// -------------------- 表单弹窗状态 --------------------
	const formMode = ref<'add' | 'edit' | 'view'>('add')

	// -------------------- 表格列配置 --------------------

	/**
	 * 创建表格列配置
	 */
	const createColumns = () =>
		[
			{
				title: '模板名称',
				key: 'template_name',
				width: 120,
				render: (row: RealNameTemplate) => {
					const text = row.template_name || '-'
					return (
						<span title={text} style={{ cursor: 'pointer' }}>
							{text}
						</span>
					)
				},
			},
			{
				title: '注册者名称',
				key: 'owner_name',
				width: 120,
				render: (row: RealNameTemplate) => row.owner_name || '-',
			},
			{
				title: '类型',
				key: 'type',
				width: 80,
				render: (row: RealNameTemplate) => {
					const typeText = getTemplateTypeText(row.type)
					return (
						<NTag type="info" size="small" bordered={false}>
							{typeText}
						</NTag>
					)
				},
			},
			{
				title: '证件类型',
				key: 'id_type',
				width: 100,
				render: (row: RealNameTemplate) => getCertificateTypeText(row.id_type),
			},
			{
				title: '证件号码',
				key: 'id_number',
				width: 160,
				render: (row: RealNameTemplate) => maskUtils.maskCertificateNumber(row.id_number),
			},
			{
				title: '联系电话',
				key: 'phone',
				width: 120,
				render: (row: RealNameTemplate) => maskUtils.maskPhone(row.phone),
			},
			{
				title: '状态',
				key: 'status',
				width: 140,
				render: (row: RealNameTemplate) => {
					const statusText = getTemplateStatusText(row.status)
					const statusType = getTemplateStatusType(row.status)
					return (
						<NSpace align="center" size={4}>
							<NTag type={statusType} size="small" bordered={false}>
								{statusText}
							</NTag>
							{row.status === 1 && (
								<NTooltip>
									{{
										trigger: () => (
											<NButton
												quaternary
												size="tiny"
												type="primary"
												onClick={(e) => {
													e.stopPropagation()
													handleRefreshStatus(row.registrant_id)
												}}
											>
												刷新
											</NButton>
										),
										default: () => '刷新实名状态',
									}}
								</NTooltip>
							)}
							{row.status === 3 && (
								<NTooltip width={220}>
									{{
										trigger: () => (
											<NIcon class="flex justify-center cursor-pointer">
												<InformationCircleOutline />
											</NIcon>
										),
										default: () => row.fail_reason,
									}}
								</NTooltip>
							)}
						</NSpace>
					)
				},
			},
			{
				title: '创建时间',
				key: 'created_at',
				width: 160,
				render: (row: RealNameTemplate) => formatDate(row.created_at, 'yyyy-MM-dd'),
			},
			{
				title: '操作',
				key: 'actions',
				width: 80,
				fixed: 'right',
				align: 'right',
				render: (row: RealNameTemplate) => (
					<NFlex justify="end">
						{/* <NButton size="small" onClick={() => handleEditTemplate(row)}>
              编辑
            </NButton> */}
						<NButton size="small" type="error" ghost onClick={() => handleDeleteTemplate(row.registrant_id)}>
							删除
						</NButton>
					</NFlex>
				),
			},
		] as DataTableColumns<RealNameTemplate>

	// -------------------- 表单配置 --------------------

	/**
	 * 创建筛选表单配置
	 */
	const formConfig = () => [
		{
			label: '搜索关键词',
			key: 'search',
			component: NInput,
			componentProps: {
				placeholder: '模板名称/邮箱/姓名/证件号',
				clearable: true,
			},
		},
		{
			label: '模板类型',
			key: 'type',
			component: NInput,
			componentProps: {
				placeholder: '选择模板类型',
				options: [{ label: '全部', value: -1 }, ...templateTypeOptions],
			},
		},
		{
			label: '状态',
			key: 'status',
			component: NInput,
			componentProps: {
				placeholder: '选择状态',
				options: [{ label: '全部', value: -1 }, ...templateStatusOptions],
			},
		},
	]

	// -------------------- 表格和分页 --------------------

	// 使用统一数据源创建表格组件
	const {
		TableComponent: TemplateTable,
		PageComponent: TemplateTablePage,
		loading,
		fetch: fetchTable,
		data: tableData,
	} = useTable<RealNameTemplate, FetchTemplatesRequest>({
		config: createColumns(),
		request: fetchTemplateList,
		defaultValue: templateTableParams,
		alias: {
			page: 'p',
			pageSize: 'rows',
		},
		watchValue: ['p', 'rows'],
	})

	// 表单实例
	const { component: FilterForm, fetch: formFetchSearch } = useForm<FetchTemplatesRequest>({
		config: formConfig(),
		defaultValue: templateTableParams,
		request: handleFormSearch,
	})

	// -------------------- 映射工具方法 --------------------
	// 注意：这些方法现在直接从useRealNameState中获取，不再需要在这里定义

	// -------------------- 事件处理 --------------------

	/**
	 * 处理表单搜索
	 * @param formData 表单数据
	 */
	async function handleFormSearch(formData: FetchTemplatesRequest) {
		// 更新筛选参数
		templateTableParams.value.p = 1
		fetchTable()
	}

	/**
	 * 处理表单重置
	 */
	function formDataReset() {
		// 重置查询参数
		templateTableParams.value.p = 1
		fetchTable()
	}

	// -------------------- 表单弹窗方法 --------------------
	/**
	 * 打开表单弹窗
	 */
	function openFormModal() {
		openRealNameDialog.value = useModal({
			title: modalTitle.value,
			area: '1000px',
			component: DomainRegistrationForm,
			componentProps: {
				mode: formMode.value,
				initialData: currentTemplate.value ? convertToFormData(currentTemplate.value) : undefined,
				refresh: fetchTable,
			},
			footer: false,
		})
	}

	/**
	 * 获取弹窗标题
	 */
	const modalTitle = computed(() => {
		switch (formMode.value) {
			case 'add':
				return '添加实名模板'
			case 'edit':
				return '编辑实名模板'
			case 'view':
				return '查看实名模板'
			default:
				return '实名模板'
		}
	})

	/**
	 * 处理添加新模板
	 */
	function handleAddTemplate() {
		formMode.value = 'add'
		setCurrentTemplate(null)
		openFormModal()
	}

	/**
	 * 处理查看模板详情
	 * @param row 模板数据行
	 */
	function handleViewTemplate(row: RealNameTemplate) {
		formMode.value = 'view'
		setCurrentTemplate(row)
		openFormModal()
	}

	/**
	 * 处理编辑模板
	 * @param row 模板数据行
	 */
	function handleEditTemplate(row: RealNameTemplate) {
		formMode.value = 'edit'
		setCurrentTemplate(row)
		openFormModal()
	}

	/**
	 * 处理删除模板
	 * @param registrantId 注册者标识ID
	 */
	async function handleDeleteTemplate(registrantId: string) {
		useDialog({
			type: 'warning',
			title: '确认删除',
			area: '40',
			content: '确定要删除此实名模板吗？此操作不可恢复。',
			positiveText: '确定',
			negativeText: '取消',
			onPositiveClick: async () => {
				try {
					await deleteTemplateById(registrantId)
					fetchTable()
				} catch (error) {
					console.error('删除模板失败:', error)
				}
			},
		})
	}

	/**
	 * 刷新实名认证状态
	 * @param registrantId 注册者标识ID
	 */
	async function handleRefreshStatus(registrantId: string) {
		try {
			const { message: apiMessage, fetch: fetchDetail } = fetchContactDetail({
				registrant_id: `${registrantId}`,
			})
			apiMessage.value = true
			await fetchDetail()
			await fetchTable()
		} catch (error) {
			console.error('刷新实名认证状态失败:', error)
			message.error('刷新实名认证状态失败，请稍后再试')
		}
	}
	// -------------------- 移动端卡片列表组件 --------------------

	/**
	 * 移动端卡片列表组件
	 */
	const TemplateCardList = defineComponent({
		name: 'TemplateCardList',
		props: {
			data: {
				type: Array as PropType<RealNameTemplate[]>,
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
					{props.data.map((item) => (
						<NCard key={item.registrant_id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								{/* 模板名称和类型 */}
								<NFlex justify="space-between" align="center">
									<div class="flex flex-col">
										<div class="font-medium text-base">{item.template_name || '-'}</div>
										{item.owner_name && <div class="text-xs text-gray-500 mt-1">{item.owner_name}</div>}
									</div>
									<NTag type="info" size="small" bordered={false}>
										{getTemplateTypeText(item.type)}
									</NTag>
								</NFlex>

								{/* 证件信息 */}
								<NFlex justify="space-between" class="text-sm text-gray-600">
									<div>
										<span class="text-gray-500">证件：</span>
										{getCertificateTypeText(item.id_type)}
									</div>
									<div>
										<span class="text-gray-500">号码：</span>
										{maskUtils.maskCertificateNumber(item.id_number)}
									</div>
								</NFlex>

								{/* 联系信息 */}
								<NFlex justify="space-between" class="text-sm text-gray-600">
									<div>
										<span class="text-gray-500">电话：</span>
										{maskUtils.maskPhone(item.phone)}
									</div>
									<div>
										<span class="text-gray-500">创建：</span>
										{formatDate(item.created_at, 'yyyy-MM-dd')}
									</div>
								</NFlex>

								{/* 状态和操作 */}
								<NFlex justify="space-between" align="center">
									<NFlex align="center" size="small">
										<NTag type={getTemplateStatusType(item.status)} size="small" bordered={false}>
											{getTemplateStatusText(item.status)}
										</NTag>
										{item.status === 1 && (
											<NTooltip>
												{{
													trigger: () => (
														<NButton
															quaternary
															size="tiny"
															type="primary"
															onClick={(e) => {
																e.stopPropagation()
																handleRefreshStatus(item.registrant_id)
															}}
														>
															刷新
														</NButton>
													),
													default: () => '刷新实名状态',
												}}
											</NTooltip>
										)}
										{item.status === 3 && (
											<NTooltip width={220}>
												{{
													trigger: () => (
														<NIcon class="flex justify-center cursor-pointer text-red-500">
															<InformationCircleOutline />
														</NIcon>
													),
													default: () => item.fail_reason,
												}}
											</NTooltip>
										)}
									</NFlex>

									{/* 操作按钮 */}
									<NFlex size="small">
										<NButton size="small" type="error" ghost onClick={() => handleDeleteTemplate(item.registrant_id)}>
											删除
										</NButton>
									</NFlex>
								</NFlex>
							</NFlex>
						</NCard>
					))}
				</NFlex>
			)
		},
	})

	// -------------------- 返回值 --------------------

	return {
		// 状态
		loading,
		isMobile,

		// 表格组件和数据
		fetchTable,
		TemplateTable,
		TemplateTablePage,
		tableData,

		// 移动端卡片
		TemplateCardList,

		formFetchSearch,
		formDataReset,

		// 事件处理
		handleAddTemplate,
		handleViewTemplate,
		handleEditTemplate,
		handleDeleteTemplate,
		handleRefreshStatus,
	}
}
