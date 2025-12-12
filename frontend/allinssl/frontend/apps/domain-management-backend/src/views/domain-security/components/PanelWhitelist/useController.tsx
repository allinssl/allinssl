/**
 * IP白名单组件控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { defineComponent, ref, computed, type PropType } from 'vue'
import { NButton, NSpace, NCard, NFlex, NSwitch, useDialog, NAlert, NText, NIcon } from 'naive-ui'
import { CopyOutline, CheckmarkOutline } from '@vicons/ionicons5'
import { formatDate } from '@baota/utils/date'
import { usePanelWhitelistState } from './useStore'
import { useTable, useForm, useFormHooks, useModal, useLoadingMask } from '@baota/naive-ui/hooks'
import { useApp } from '@/components/layout/useStore'

import type { PanelWhitelistListRequest, PanelWhitelistItem, PanelWhitelistFormData, PanelWhitelistFormInputData, PanelWhitelistToggleRequest } from '../../types.d'
import { TableColumns } from 'naive-ui/es/data-table/src/interface'

/**
 * IP白名单组件控制器
 */
export function useController() {
	// 获取状态管理
	const {
		fetchPanelWhitelistListData,
		filterFormData,
		formData,
		isEditing,
		editingId,
		resetFormData,
		setEditingData,
		createPanelWhitelist,
		togglePanelWhitelistStatus,
		deletePanelWhitelistItem,
	} = usePanelWhitelistState()

	const { useFormInput, useFormSwitch } = useFormHooks()
	const dialog = useDialog()

	// 获取移动端状态
	const { isMobile } = useApp()



	/**
	 * 创建/编辑表单配置
	 */
	const modalFormConfig = computed((): any[] => {
		const config: any[] = [
			useFormInput(
				'名称',
				'name',
				{
					placeholder: '请输入名称',
					clearable: true,
				},
				{
					required: true,
					showFeedback: true,
					labelWidth: '90px',
					rule: {
						required: true,
						message: '请输入名称',
						trigger: ['blur', 'input'],
					},
				},
			),
			useFormInput(
				'IP白名单',
				'whitelist_ips',
				{
					placeholder: '请输入IP地址，每行一个IP',
					clearable: true,
					type: 'textarea',
					autosize: { minRows: 3, maxRows: 6 },
				},
				{
					required: false,
					labelWidth: '90px',
				},
			),

			useFormInput(
				'备注',
				'remark',
				{
					placeholder: '请输入备注信息',
					clearable: true,
					type: 'textarea',
					autosize: { minRows: 2, maxRows: 4 },
				},
				{
					required: false,
					labelWidth: '90px',
				},
			),
             useFormSwitch(
				'是否启用',
				'is_enabled',
				{
					checkedValue: true,
					uncheckedValue: false,
				},
				{
					required: false,
					showFeedback: false,
					labelWidth: '90px',
				},
			),
		]

		// 添加按钮区域
		config.push(
			{
				type: 'custom' as const,
				render: () => (
					<NFlex justify="end" size="medium" class="mt-4">
						<NButton onClick={() => closeModal()}>取消</NButton>
						<NButton
							type="primary"
							disabled={formLoading.value}
							onClick={async () => {
								try {
									await submitForm()
								} catch (error) {
									console.error('表单提交失败:', error)
								}
							}}
						>
							{isEditing.value ? '更新' : '创建'}
						</NButton>
					</NFlex>
				),
			},
		)

		return config
	})

	/**
	 * 表格列配置
	 */
	const createColumns = [
		{
			title: '名称',
			key: 'name',
			width: 200,
			ellipsis: { tooltip: true },
			render: (row: PanelWhitelistItem) => (
				<div class="flex items-center gap-2">
					<div class="flex flex-col">
						<div class="font-medium">{row.name}</div>
					</div>
				</div>
			),
		},
		{
			title: '状态',
			key: 'is_enabled',
			width: 100,
			render: (row: PanelWhitelistItem) => (
				<NSwitch
					value={row.is_enabled}
					checkedValue={true}
					uncheckedValue={false}
					onUpdateValue={async (value: boolean) => {
						const result = await togglePanelWhitelistStatus(row, value)
						if (result.success) {
							await fetchPanelWhitelists()
						}
					}}
				/>
			),
		},
		{
			title: 'IP白名单',
			key: 'whitelist_ips',
			width: 200,
			ellipsis: { tooltip: true },
			render: (row: PanelWhitelistItem) => (row.whitelist_ips?.length ? row.whitelist_ips.join(', ') : '-'),
		},
		{
			title: '备注',
			key: 'remark',
			width: 150,
			ellipsis: { tooltip: true },
			render: (row: PanelWhitelistItem) => (row.remark || '-'),
		},
		{
			title: '创建时间',
			key: 'created_at',
			width: 180,
			render: (row: PanelWhitelistItem) => {
				if (row.created_at) {
					// 处理时间戳（秒）
					const timestamp = typeof row.created_at === 'number' ? row.created_at * 1000 : row.created_at
					const date = new Date(timestamp)
					if (!isNaN(date.getTime())) {
						return formatDate(date.getTime(), 'yyyy-MM-dd HH:mm:ss')
					}
				}
				return '-'
			},
		},
		{
			title: '操作',
			key: 'actions',
			width: 150,
			align: 'right',
			fixed: 'right',
			render: (row: PanelWhitelistItem) => (
				<NSpace justify="end" size="small">
					<NButton
						size="small"
						type="primary"
						ghost
						onClick={() => handleEdit(row)}
					>
						编辑
					</NButton>
					<NButton
						size="small"
						type="error"
						ghost
						onClick={() => {
							dialog.warning({
								title: '确认删除',
								content: `确定要删除IP白名单"${row.name}"吗？此操作不可撤销。`,
								positiveText: '确定',
								negativeText: '取消',
								onPositiveClick: async () => {
									const result = await deletePanelWhitelistItem(row.id)
									if (result.success) {
										await fetchPanelWhitelists()
									}
								},
							})
						}}
					>
						删除
					</NButton>
				</NSpace>
			),
		},
	] as TableColumns<PanelWhitelistItem>

	/**
	 * 移动端卡片组件
	 */
	const PanelWhitelistCardList = defineComponent({
		name: 'PanelWhitelistCardList',
		props: {
			data: {
				type: Array as PropType<PanelWhitelistItem[]>,
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
					{props.data.map((item: PanelWhitelistItem) => (
						<NCard key={item.id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
									<NFlex align="center" justify="space-between">
										<div class="font-medium text-base">{item.name}</div>
										<NSwitch
											value={item.is_enabled}
											checkedValue={true}
											uncheckedValue={false}
											onUpdateValue={async (value: boolean) => {
												const result = await togglePanelWhitelistStatus(item, value)
												if (result.success) {
													await fetchPanelWhitelists()
												}
											}}
										/>
									</NFlex>

								{item.whitelist_ips && item.whitelist_ips.length > 0 && (
									<div class="text-sm">
										<span class="text-gray-500">IP白名单：</span>
										<span class="text-gray-700">
											{item.whitelist_ips.join(', ')}
										</span>
									</div>
								)}

								{item.remark && (
									<div class="text-sm">
										<span class="text-gray-500">备注：</span>
										<span class="text-gray-700">
											{item.remark}
										</span>
									</div>
								)}

								<div class="text-sm text-gray-600">
									<span class="text-gray-500">创建时间：</span>
									{item.created_at
										? (() => {
												// 处理时间戳（秒）
												const timestamp = typeof item.created_at === 'number' ? item.created_at * 1000 : item.created_at
												const date = new Date(timestamp)
												return !isNaN(date.getTime()) ? formatDate(date.getTime(), 'yyyy-MM-dd HH:mm:ss') : '-'
											})()
										: '-'
									}
								</div>
								<NFlex justify="end" class="mt-2">
									<NButton
										size="small"
										type="primary"
										ghost
										onClick={() => handleEdit(item)}
									>
										编辑
									</NButton>
									<NButton
										size="small"
										type="error"
										ghost
										onClick={() => {
											dialog.warning({
												title: '确认删除',
												content: `确定要删除IP白名单"${item.name}"吗？此操作不可撤销。`,
												positiveText: '确定',
												negativeText: '取消',
												onPositiveClick: async () => {
													const result = await deletePanelWhitelistItem(item.id)
													if (result.success) {
														await fetchPanelWhitelists()
													}
												},
											})
										}}
									>
										删除
									</NButton>
								</NFlex>
							</NFlex>
						</NCard>
					))}
				</NFlex>
			)
		},
	})

	// 表格实例
	const {
		TableComponent: PanelWhitelistTable,
		PageComponent: PanelWhitelistTablePage,
		loading,
		fetch: fetchPanelWhitelists,
		data: tableData,
	} = useTable<PanelWhitelistItem, PanelWhitelistListRequest>({
		config: createColumns,
		request: fetchPanelWhitelistListData,
		defaultValue: filterFormData,
		alias: {
			page: 'p',
			pageSize: 'rows',
		},
		watchValue: ['p', 'rows'],
	})



	// 创建/编辑表单实例
	const { component: ModalForm, fetch: submitForm, loading: formLoading } = useForm<PanelWhitelistFormInputData>({
		config: modalFormConfig,
		defaultValue: formData,
		request: handleFormSubmit,
	})

	// 模态框引用
	const currentModal = ref<any>(null)

	/**
	 * 关闭模态框
	 */
	const closeModal = () => {
		if (currentModal.value) {
			currentModal.value.close()
			currentModal.value = null
		}
		resetFormData()
	}

	// -------------------- 事件处理 --------------------

	/**
	 * 表单提交处理
	 */
	async function handleFormSubmit(data: PanelWhitelistFormInputData): Promise<void> {
		const { open: openLoad, close: closeLoad } = useLoadingMask({ 
			text: isEditing.value ? '正在更新IP白名单，请稍后...' : '正在创建IP白名单，请稍后...' 
		})
		openLoad()
		try {
			// 处理IP白名单数据
			const whitelistIps = data.whitelist_ips
				? data.whitelist_ips.trim().split(/\n/).map(ip => ip.trim()).filter(ip => ip.length > 0)
				: []

			if (isEditing.value && editingId.value) {
				// 编辑模式
				const editData: PanelWhitelistToggleRequest = {
					id: editingId.value,
					name: data.name,
					whitelist_ips: whitelistIps,
					is_enabled: data.is_enabled,
					remark: data.remark || ''
				}

				const result = await togglePanelWhitelistStatus(editData)
				if (result.success) {
					await fetchPanelWhitelists()
					closeModal()
				}
			} else {
				// 创建模式
				const submitData: PanelWhitelistFormData = {
					name: data.name,
					whitelist_ips: whitelistIps,
					is_enabled: data.is_enabled,
					remark: data.remark || ''
				}

				const result = await createPanelWhitelist(submitData)
				if (result.success) {
					await fetchPanelWhitelists()
					closeModal()
				}
			}
		} catch (error) {
			console.error('表单提交失败:', error)
		} finally {
			closeLoad()
		}
	}

	/**
	 * 打开创建白名单弹窗
	 */
	function handleCreate() {
		resetFormData()
		currentModal.value = useModal({
			title: '创建IP白名单',
			area: '500px',
			component: <ModalForm />,
			footer: false,
			onClose: () => {
				resetFormData()
				currentModal.value = null
			},
		})
	}

	/**
	 * 打开编辑白名单弹窗
	 */
	function handleEdit(item: PanelWhitelistItem) {
		setEditingData(item)
		currentModal.value = useModal({
			title: '编辑IP白名单',
			area: '500px',
			component: <ModalForm />,
			footer: false,
			onClose: () => {
				resetFormData()
				currentModal.value = null
			},
		})
	}

	return {
		// 状态
		loading,
		isMobile,

		// 表格
		PanelWhitelistTable,
		PanelWhitelistTablePage,
		tableData,
		fetchPanelWhitelists,

		// 移动端卡片
		PanelWhitelistCardList,

		// 事件处理
		handleCreate,
		handleEdit,
	}
}
