/**
 * API管理组件控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { defineComponent, ref, computed, type PropType } from 'vue'
import { NButton, NSpace, NCard, NFlex, NSwitch, useDialog, NAlert, NText, NIcon } from 'naive-ui'
import { CopyOutline, CheckmarkOutline } from '@vicons/ionicons5'
import { formatDate } from '@baota/utils/date'
import { useApiManagementState } from './useStore'
import { useTable, useForm, useFormHooks, useModal, useLoadingMask } from '@baota/naive-ui/hooks'
import { useApp } from '@/components/layout/useStore'

import type { ApiKeyListRequest, ApiKeyItem, ApiKeyFormData } from '../../types.d'
import { TableColumns } from 'naive-ui/es/data-table/src/interface'

/**
 * API管理组件控制器
 */
export function useController() {
	// 获取状态管理
	const {
		fetchApiKeyListData,
		filterFormData,
		statusOptions,
		formData,
		isEditing,
		editingId,
		resetFormData,
		setEditingData,
		createApiKey,
		updateApiKey,
		toggleApiKeyStatus,
		regenerateApiKey,
		deleteApiKey,
	} = useApiManagementState()

	const { useFormInput, useFormSelect, useFormSwitch, useFormHelp } = useFormHooks()
	const dialog = useDialog()

	// 获取移动端状态
	const { isMobile } = useApp()

	/**
	 * 筛选表单配置
	 */
	const filterFormConfig = () => [
		useFormSelect(
			'',
			'status',
			statusOptions.value,
			{
				class: 'w-28',
			},
			{ showLabel: false, showFeedback: false }
		),
		useFormInput(
			'',
			'keyword',
			{
				placeholder: '请输入名称',
				clearable: true,
				class: 'w-64',
			},
			{ showLabel: false, showFeedback: false }
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
	 * 创建/编辑表单配置
	 */
	const modalFormConfig = computed(() => {
		const config: any[] = [
			useFormInput(
				'密钥名称',
				'name',
				{
					placeholder: '请输入密钥名称',
					clearable: true,
				},
				{
					required: true,
					showFeedback: true,
					labelWidth: '90px',
					rule: {
						required: true,
						message: '请输入密钥名称',
						trigger: ['blur', 'input'],
					},
				},
			),
			useFormInput(
				'IP白名单',
				'ip_whitelist',
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
		]

		// 只在编辑时显示状态字段
		if (isEditing.value) {
			config.push(
				useFormSwitch(
					'状态',
					'status',
					{
						checkedValue: 1,
						uncheckedValue: 0,
					},
					{
						required: false,
						showFeedback: false,
						labelWidth: '90px',
					},
				),
			)
		}

		// 添加按钮区域
		config.push(
			useFormHelp(
				[
					{
						content: '为了安全，建议设置IP白名单。留空表示不限制IP访问。每行一个IP地址。',
					},
				],
				{
					listStyle: 'none',
					class: 'text-[13px] text-gray-500 !pl-[65px] !leading-[1.6] mt-2 mb-4 ml-0',
				} as any,
			),
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
			render: (row: ApiKeyItem) => (
				<div class="flex items-center gap-2">
					<div class="flex flex-col">
						<div class="font-medium">{row.name}</div>
					</div>
				</div>
			),
		},
		{
			title: '状态',
			key: 'status',
			width: 100,
			render: (row: ApiKeyItem) => (
				<NSwitch
					value={row.status === 1}
					checkedValue={true}
					uncheckedValue={false}
					onUpdateValue={async (value: boolean) => {
						const newStatus = value ? 1 : 0
						try {
							await toggleApiKeyStatus(row.id, newStatus)
							await fetchApiKeys()
						} catch (error) {
							console.error('切换状态失败:', error)
						}
					}}
				/>
			),
		},
		{
			title: '最后调用',
			key: 'last_used_at',
			width: 180,
			render: (row: ApiKeyItem) => {
				if (row.last_used_at && row.last_used_at !== null) {
					const date = new Date(row.last_used_at)
					if (!isNaN(date.getTime())) {
						return formatDate(date.getTime(), 'yyyy-MM-dd HH:mm:ss')
					}
				}
				return '-'
			},
		},
		{
			title: 'IP白名单',
			key: 'ip_whitelist',
			width: 200,
			ellipsis: { tooltip: true },
			render: (row: ApiKeyItem) => (row.ip_whitelist?.length ? row.ip_whitelist.join(', ') : '-'),
		},
		{
			title: '操作',
			key: 'actions',
			width: 220,
			align: 'right',
			fixed: 'right',
			render: (row: ApiKeyItem) => (
				<NSpace justify="end" size="small">
					<NButton size="small" type="primary" ghost onClick={() => handleEdit(row)}>
						编辑
					</NButton>
					<NButton size="small" type="primary" ghost onClick={() => handleRegenerate(row)}>
						重新生成
					</NButton>
					<NButton size="small" type="error" ghost onClick={() => handleDelete(row.id)}>
						删除
					</NButton>
				</NSpace>
			),
		},
	] as TableColumns<ApiKeyItem>

	/**
	 * 移动端卡片组件
	 */
	const ApiKeyCardList = defineComponent({
		name: 'ApiKeyCardList',
		props: {
			data: {
				type: Array as PropType<ApiKeyItem[]>,
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
					{props.data.map((item: ApiKeyItem) => (
						<NCard key={item.id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								<NFlex align="center" justify="space-between">
									<div class="font-medium text-base">{item.name}</div>
									<NSwitch
										value={item.status === 1}
										checkedValue={true}
										uncheckedValue={false}
										onUpdateValue={async (value: boolean) => {
											const newStatus = value ? 1 : 0
											try {
												await toggleApiKeyStatus(item.id, newStatus)
												await fetchApiKeys()
											} catch (error) {
												console.error('切换状态失败:', error)
											}
										}}
									/>
								</NFlex>

								{item.ip_whitelist && item.ip_whitelist.length > 0 && (
									<div class="text-sm">
										<span class="text-gray-500">IP白名单：</span>
										<span class="text-gray-700">
											{item.ip_whitelist.join(', ')}
										</span>
									</div>
								)}

								<div class="text-sm text-gray-600">
									<span class="text-gray-500">最后调用：</span>
									{item.last_used_at && item.last_used_at !== null
										? (() => {
												const date = new Date(item.last_used_at)
												return !isNaN(date.getTime()) ? formatDate(date.getTime(), 'yyyy-MM-dd HH:mm:ss') : '-'
											})()
										: '-'
									}
								</div>

								<NFlex justify="end" size="small">
									<NButton size="small" type="primary" ghost onClick={() => handleEdit(item)}>
										编辑
									</NButton>
									<NButton size="small" type="primary" ghost onClick={() => handleRegenerate(item)}>
										重新生成
									</NButton>
									<NButton size="small" type="error" ghost onClick={() => handleDelete(item.id)}>
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
		TableComponent: ApiKeyTable,
		PageComponent: ApiKeyTablePage,
		loading,
		fetch: fetchApiKeys,
		data: tableData,
	} = useTable<ApiKeyItem, ApiKeyListRequest>({
		config: createColumns,
		request: fetchApiKeyListData,
		defaultValue: filterFormData,
		alias: {
			page: 'p',
			pageSize: 'rows',
		},
		watchValue: ['p', 'rows', 'status'],
	})

	// 筛选表单实例
	const { component: FilterForm, fetch: formFetchSearch } = useForm<ApiKeyListRequest>({
		config: filterFormConfig(),
		defaultValue: filterFormData,
		request: handleFormSearch,
	})

	// 创建/编辑表单实例
	const { component: ModalForm, fetch: submitForm, loading: formLoading } = useForm<ApiKeyFormData>({
		config: modalFormConfig,
		defaultValue: formData,
		request: handleFormSubmit,
	})

	// 模态框引用
	const currentModal = ref<any>(null)
	
	/**
	 * API密钥信息显示组件
	 */
	const ApiKeyInfoModal = defineComponent({
		name: 'ApiKeyInfoModal',
		props: {
			data: {
				type: Object as PropType<{
					access_key: string
					account_id: string
					secret_key: string
				}>,
				required: true
			}
		},
		setup(props) {
			const copiedFields = ref<Set<string>>(new Set())
			
			const copyToClipboard = async (text: string, field: string) => {
				try {
					await navigator.clipboard.writeText(text)
					copiedFields.value.add(field)
					setTimeout(() => {
						copiedFields.value.delete(field)
					}, 2000)
				} catch (error) {
					console.error('复制失败:', error)
				}
			}
			
			const copyAllInfo = async () => {
				const allInfo = `Access Key: ${props.data.access_key}\nAccount ID: ${props.data.account_id}\nSecret Key: ${props.data.secret_key}`
				try {
					await navigator.clipboard.writeText(allInfo)
					copiedFields.value.add('all')
					setTimeout(() => {
						copiedFields.value.delete('all')
					}, 2000)
				} catch (error) {
					console.error('复制失败:', error)
				}
			}
			
		const keyItems = [
			{ label: 'Access Key', key: 'access_key', value: props.data.access_key },
			{ label: 'Secret Key', key: 'secret_key', value: props.data.secret_key },
			{ label: 'Account ID', key: 'account_id', value: props.data.account_id },
		]

		const renderCopyButton = (key: string, value: string) => (
			<NButton
				size="small"
				type={copiedFields.value.has(key) ? 'success' : 'default'}
				onClick={() => copyToClipboard(value, key)}
			>
				<NIcon class="mr-1">
					{copiedFields.value.has(key) ? <CheckmarkOutline /> : <CopyOutline />}
				</NIcon>
				{copiedFields.value.has(key) ? '已复制' : '复制'}
			</NButton>
		)

		return () => (
			<div class="p-4">
				<NAlert type="warning" class="mb-4" showIcon>
					API密钥创建成功！请立即保存以下信息，关闭后将无法再次查看。
				</NAlert>

				<div class="space-y-4">
					{keyItems.map((item) => (
						<div key={item.key} class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-700 mb-1">{item.label}:</div>
								<NText code class="text-sm select-all">
									{item.value}
								</NText>
							</div>
							{renderCopyButton(item.key, item.value)}
						</div>
					))}
				</div>

				<NFlex justify="center" class="mt-6">
					<NButton type="primary" size="large" onClick={copyAllInfo}>
						<NIcon class="mr-1">{copiedFields.value.has('all') ? <CheckmarkOutline /> : <CopyOutline />}</NIcon>
						{copiedFields.value.has('all') ? '全部已复制' : '复制全部信息'}
					</NButton>
				</NFlex>
			</div>
		)
		}
	})

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
	 * 表单搜索触发
	 */
	async function handleFormSearch(formData: ApiKeyListRequest) {
		await fetchApiKeys()
	}

	/**
	 * 表单提交处理
	 */
	async function handleFormSubmit(data: ApiKeyFormData): Promise<void> {
		const { open: openLoad, close: closeLoad } = useLoadingMask({ text: `正在${isEditing.value ? '更新' : '创建'}API密钥，请稍后...` })
		openLoad()
		try {
		if (isEditing.value && editingId.value) {
			await updateApiKey(editingId.value, data)
			await fetchApiKeys()
			closeModal()
		} else {
				const result = await createApiKey(data)
				if (result.success) {
					await fetchApiKeys()
					closeModal()
					if (result.keyInfo) {
						useModal({
							title: 'API密钥创建成功',
							area: '600px',
							component: <ApiKeyInfoModal data={result.keyInfo} />,
							footer: false,
							maskClosable: false,
							closable: true,
						})
					}
				}
			}
		} catch (error) {
			console.error('表单提交失败:', error)
		} finally {
			closeLoad()
		}
	}

	/**
	 * 打开创建密钥弹窗
	 */
	function handleCreate() {
		resetFormData()
		currentModal.value = useModal({
			title: '创建API密钥',
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
	 * 编辑密钥
	 */
	function handleEdit(item: ApiKeyItem) {
		setEditingData(item)
		currentModal.value = useModal({
			title: '编辑API密钥',
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
	 * 重新生成密钥
	 */
	function handleRegenerate(item: ApiKeyItem) {
		dialog.warning({
			title: '确认重新生成',
			content: `确定要重新生成"${item.name}"的API密钥吗？重新生成后，原密钥将失效，请及时更新您的应用配置。`,
			positiveText: '重新生成',
			negativeText: '取消',
			onPositiveClick: async () => {
				const { open: openLoad, close: closeLoad } = useLoadingMask({ text: '正在重新生成API密钥，请稍后...' })
				openLoad()
				try {
					const result = await regenerateApiKey(item.id)
					if (result.success) {
						await fetchApiKeys()
						if (result.keyInfo) {
							useModal({
								title: 'API密钥重新生成成功',
								area: '600px',
								component: <ApiKeyInfoModal data={result.keyInfo} />,
								footer: false,
								maskClosable: false,
								closable: true,
							})
						}
					}
				} catch (error) {
					console.error('重新生成API密钥失败:', error)
				} finally {
					closeLoad()
				}
			},
		})
	}

	/**
	 * 删除密钥
	 */
	function handleDelete(id: number) {
		dialog.warning({
			title: '确认删除',
			content: '确定要删除这个API密钥吗？删除后无法恢复。',
			positiveText: '删除',
			negativeText: '取消',
			onPositiveClick: async () => {
				const { open: openLoad, close: closeLoad } = useLoadingMask({ text: '正在删除API密钥，请稍后...' })
				openLoad()
				try {
					await deleteApiKey(id)
					await fetchApiKeys()
				} catch (error) {
					console.error('删除API密钥失败:', error)
				} finally {
					closeLoad()
				}
			},
		})
	}

	return {
		// 状态
		loading,
		isMobile,

		// 表格
		ApiKeyTable,
		ApiKeyTablePage,
		tableData,

		// 移动端卡片
		ApiKeyCardList,

		// 表单
		FilterForm,
		formFetchSearch,

		// 事件处理
		handleCreate,
		handleEdit,
		handleRegenerate,
		handleDelete,
	}
}