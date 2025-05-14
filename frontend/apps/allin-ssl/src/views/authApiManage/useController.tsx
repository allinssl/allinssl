import {
	FormInst,
	FormItemRule,
	FormRules,
	NButton,
	NFlex,
	NFormItem,
	NFormItemGi,
	NGrid,
	NInput,
	NSelect,
	NSpace,
	NTag,
	NText,
	type DataTableColumns,
} from 'naive-ui'
import {
	useModal,
	useDialog,
	useTable,
	useTablePage,
	useModalHooks,
	useFormHooks,
	useForm,
	useLoadingMask,
} from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { isEmail, isIp, isPort, isUrl } from '@baota/utils/business'
import { $t } from '@locales/index'
import { useStore } from './useStore'

import type { AccessItem, AccessListParams, AddAccessParams, SshAccessConfig, UpdateAccessParams } from '@/types/access'
import type { FormConfig } from '@baota/naive-ui/types/form'

import ApiManageForm from './components/apiManageForm'
import SvgIcon from '@components/svgIcon'
import TypeIcon from '@components/typeIcon'
import { useStore as useLayoutStore } from '@layout/useStore'

const { sourceTypes } = useLayoutStore()
// 状态和方法
const {
	accessTypeMap,
	apiFormProps,
	fetchAccessList,
	deleteExistingAccess,
	addNewAccess,
	updateExistingAccess,
	resetApiForm,
} = useStore()

// 消息和对话框
const { handleError } = useError()

/**
 * @description 授权API管理业务逻辑控制器
 * @returns {Object} 返回授权API相关的状态数据和处理方法
 */
export const useController = () => {
	/**
	 * @description 创建表格列配置
	 * @returns {DataTableColumns<AccessItem>} 返回表格列配置数组
	 */
	const createColumns = (): DataTableColumns<AccessItem> => [
		{
			title: $t('t_2_1745289353944'),
			key: 'name',
			width: 200,
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: $t('t_1_1746754499371'),
			key: 'type',
			width: 120,
			render: (row) => <TypeIcon icon={row.type} type="success" />,
		},
		{
			title: $t('t_2_1746754500270'),
			key: 'type',
			width: 180,
			render: (row) => (
				<NSpace>
					{row.access_type?.map((type) => {
						return (
							<NTag key={type} type={type === 'dns' ? 'success' : 'info'} size="small">
								{accessTypeMap[type as keyof typeof accessTypeMap]}
							</NTag>
						)
					})}
				</NSpace>
			),
		},
		{
			title: $t('t_7_1745215914189'),
			key: 'create_time',
			width: 180,
		},
		{
			title: $t('t_0_1745295228865'),
			key: 'update_time',
			width: 180,
		},
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			width: 180,
			align: 'right',
			fixed: 'right',
			render: (row) => {
				return (
					<NSpace justify="end">
						<NButton size="tiny" strong secondary type="primary" onClick={() => openEditForm(row)}>
							{$t('t_11_1745215915429')}
						</NButton>
						<NButton size="tiny" strong secondary type="error" onClick={() => confirmDelete(row.id)}>
							{$t('t_12_1745215914312')}
						</NButton>
					</NSpace>
				)
			},
		},
	]

	// 表格实例
	const {
		component: ApiTable,
		loading,
		param,
		data,
		total,
		fetch,
	} = useTable<AccessItem, AccessListParams>({
		config: createColumns(),
		request: fetchAccessList,
		defaultValue: {
			p: 1,
			limit: 10,
			search: '',
		},
		watchValue: ['p', 'limit'],
	})

	// 分页实例
	const { component: ApiTablePage } = useTablePage({
		param,
		total,
		alias: {
			page: 'p',
			pageSize: 'limit',
		},
	})

	/**
	 * @description 打开添加授权API弹窗
	 */
	const openAddForm = () => {
		useModal({
			title: $t('t_0_1745289355714'),
			area: 500,
			component: ApiManageForm,
			footer: true,
			onUpdateShow: (show) => {
				if (!show) fetch()
				resetApiForm()
			},
		})
	}

	/**
	 * @description 打开编辑授权API弹窗
	 * @param {AccessItem} row - 授权API信息
	 */
	const openEditForm = (row: AccessItem) => {
		useModal({
			title: $t('t_4_1745289354902'),
			area: 500,
			component: ApiManageForm,
			componentProps: { data: row },
			footer: true,
			onUpdateShow: (show) => {
				if (!show) fetch()
				resetApiForm()
			},
		})
	}

	/**
	 * @description 确认删除授权API
	 * @param {number} id - 授权API ID
	 */
	const confirmDelete = (id: string) => {
		useDialog({
			title: $t('t_5_1745289355718'),
			content: $t('t_6_1745289358340'),
			confirmText: $t('t_5_1744870862719'),
			cancelText: $t('t_4_1744870861589'),
			onPositiveClick: async () => {
				await deleteExistingAccess(id)
				await fetch()
			},
		})
	}

	// 挂载时，获取数据
	onMounted(fetch)

	return {
		loading,
		fetch,
		ApiTable,
		ApiTablePage,
		param,
		data,
		openAddForm,
	}
}

/**
 * @description 授权API表单控制器
 * @returns {object} 返回controller对象
 */
export const useApiFormController = (props: { data: AccessItem }) => {
	const { confirm } = useModalHooks() // 弹窗挂载方法
	const { open: openLoad, close: closeLoad } = useLoadingMask({ text: $t('t_0_1746667592819') })
	const { useFormInput, useFormRadioButton, useFormSwitch, useFormTextarea, useFormCustom } = useFormHooks()
	const param = (props.data?.id ? ref({ ...props.data, config: JSON.parse(props.data.config) }) : apiFormProps) as Ref<
		AddAccessParams | UpdateAccessParams
	>
	// 表单规则
	const rules = {
		name: {
			required: true,
			message: $t('t_27_1745289355721'),
			trigger: 'input',
		},
		type: {
			required: true,
			message: $t('t_28_1745289356040'),
			trigger: 'change',
		},
		config: {
			host: {
				required: true,
				trigger: 'input',
				validator: (rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
					if (!isIp(value)) {
						return callback(new Error($t('t_0_1745317313835')))
					}
					callback()
				},
			},
			port: {
				required: true,
				trigger: 'input',
				validator: (rule: FormItemRule, value: number, callback: (error?: Error) => void) => {
					if (!isPort(value.toString())) {
						return callback(new Error($t('t_1_1745317313096')))
					}
					callback()
				},
			},
			user: {
				required: true,
				trigger: 'input',
				message: $t('t_3_1744164839524'),
			},
			password: {
				required: true,
				message: $t('t_4_1744164840458'),
				trigger: 'input',
			},
			key: {
				required: true,
				message: $t('t_31_1745289355715'),
				trigger: 'input',
			},
			url: {
				required: true,
				trigger: 'input',
				validator: (rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
					if (!isUrl(value)) {
						return callback(new Error($t('t_2_1745317314362')))
					}
					callback()
				},
			},
			api_key: {
				trigger: 'input',
				validator: (rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
					if (!value.length) {
						if (param.value.type === 'cloudflare') {
							return callback(new Error($t('t_0_1747042966820')))
						} else if (param.value.type === 'btpanel') {
							return callback(new Error($t('t_1_1747042969705')))
						}
					}
					callback()
				},
			},
			access_key_id: {
				required: true,
				message: $t('t_4_1745317314054'),
				trigger: 'input',
			},
			access_key_secret: {
				required: true,
				message: $t('t_5_1745317315285'),
				trigger: 'input',
			},
			secret_id: {
				required: true,
				message: $t('t_6_1745317313383'),
				trigger: 'input',
			},
			secret_key: {
				trigger: 'input',
				validator: (rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
					if (!value.length) {
						if (param.value.type === 'tencentcloud') {
							return callback(new Error($t('t_2_1747042967277')))
						} else if (param.value.type === 'huaweicloud') {
							return callback(new Error($t('t_3_1747042967608')))
						}
					}
					callback()
				},
			},
			access_key: {
				required: true,
				message: $t('t_4_1747042966254'),
				trigger: 'input',
			},
			email: {
				trigger: 'input',
				validator: (rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
					if (!isEmail(value)) {
						return callback(new Error($t('t_5_1747042965911')))
					}
					callback()
				},
			},
		},
	}

	// 类型列表
	const typeList = Object.entries(sourceTypes.value).map(([key, value]) => ({
		label: value.name,
		value: key,
		access: value.access,
	}))

	// 表单配置
	const config = computed(() => {
		const items: FormConfig = [
			useFormInput($t('t_2_1745289353944'), 'name'),
			useFormCustom(() => {
				return (
					<NFormItem label={$t('t_41_1745289354902')} path="type">
						<NSelect
							class="w-full"
							options={typeList}
							renderLabel={renderLabel}
							renderTag={renderSingleSelectTag}
							disabled={!!props.data?.id}
							filterable
							placeholder={$t('t_0_1745833934390')}
							v-model:value={param.value.type}
							v-slots={{
								empty: () => {
									return <span class="text-[1.4rem]">{$t('t_0_1745833934390')}</span>
								},
							}}
						/>
					</NFormItem>
				)
			}),
		]
		switch (param.value.type) {
			case 'ssh':
				items.push(
					useFormCustom(() => {
						return (
							<NGrid cols={24} xGap={4}>
								<NFormItemGi label={$t('t_1_1745833931535')} span={16} path="config.host">
									<NInput v-model:value={(param.value.config as SshAccessConfig).host} />
								</NFormItemGi>
								<NFormItemGi label={$t('t_2_1745833931404')} span={8} path="config.port">
									<NInput v-model:value={(param.value.config as SshAccessConfig).port} />
								</NFormItemGi>
							</NGrid>
						)
					}),
					useFormInput($t('t_44_1745289354583'), 'config.user'),
					useFormRadioButton($t('t_45_1745289355714'), 'config.mode', [
						{ label: $t('t_48_1745289355714'), value: 'password' },
						{ label: $t('t_1_1746667588689'), value: 'key' },
					]),
					(param.value.config as SshAccessConfig)?.mode === 'password'
						? useFormInput($t('t_48_1745289355714'), 'config.password')
						: useFormTextarea($t('t_1_1746667588689'), 'config.key', {
								rows: 3,
								placeholder: $t('t_3_1745317313561'),
							}),
				)
				break
			case '1panel':
			case 'btpanel':
				items.push(
					useFormInput($t('t_2_1746667592840'), 'config.url'),
					useFormInput($t('t_55_1745289355715'), 'config.api_key'),
					useFormSwitch(
						$t('t_3_1746667592270'),
						'config.ignore_ssl',
						{
							checkedValue: '1',
							uncheckedValue: '0',
						},
						{
							showRequireMark: false,
						},
					),
				)
				break

			case 'aliyun':
				items.push(
					useFormInput('AccessKeyId', 'config.access_key'),
					useFormInput('AccessKeySecret', 'config.access_secret'),
				)
				break
			case 'tencentcloud':
				items.push(useFormInput('SecretId', 'config.secret_id'), useFormInput('SecretKey', 'config.secret_key'))
				break
			case 'huaweicloud':
				items.push(useFormInput('AccessKey', 'config.access_key'), useFormInput('SecretKey', 'config.secret_key'))
				break
			case 'cloudflare':
				items.push(useFormInput('邮箱', 'config.email'), useFormInput('APIKey', 'config.api_key'))
				break
			default:
				break
		}
		return items
	})

	// 切换类型时，重置表单
	watch(
		() => param.value.type,
		(newVal) => {
			switch (newVal) {
				case 'ssh':
					param.value.config = {
						host: '',
						port: 22,
						user: 'root',
						mode: 'password',
						password: '',
					}
					break
				case '1panel':
				case 'btpanel':
					param.value.config = {
						url: '',
						api_key: '',
						ignore_ssl: '0',
					}
					break
				case 'aliyun':
					param.value.config = {
						access_key_id: '',
						access_key_secret: '',
					}
					break
				case 'tencentcloud':
					param.value.config = {
						secret_id: '',
						secret_key: '',
					}
					break
			}
		},
	)

	/**
	 * @description 渲染单选标签
	 * @param {Record<string, any>} option - 选项
	 * @returns {VNode} 渲染后的VNode
	 */
	const renderSingleSelectTag = ({ option }: Record<string, any>): VNode => {
		return (
			<NFlex class="w-full">
				{option.label ? (
					renderLabel(option)
				) : (
					<span class="text-[1.4rem] text-gray-400">{$t('t_0_1745833934390')}</span>
				)}
			</NFlex>
		)
	}

	/**
	 * @description 渲染标签
	 * @param {Record<string, any>} option - 选项
	 * @returns {VNode} 渲染后的VNode
	 */
	const renderLabel = (option: { value: string; label: string; access: string[] }): VNode => {
		return (
			<NFlex justify="space-between" class="w-[38rem]">
				<NFlex align="center" size="small">
					<SvgIcon icon={`resources-${option.value}`} size="1.6rem" />
					<NText>{option.label}</NText>
				</NFlex>
				<NFlex class="pr-[1rem]">
					{option.access.map((item: string) => {
						return (
							<NTag type={item === 'dns' ? 'success' : 'info'} size="small" key={item}>
								{accessTypeMap[item as keyof typeof accessTypeMap]}
							</NTag>
						)
					})}
				</NFlex>
			</NFlex>
		)
	}

	/**
	 * @description 提交授权API表单
	 * @param {UpdateAccessParams | AddAccessParams} param 请求参数
	 * @param {Ref<FormInst>} formRef 表单实例
	 */
	const submitApiManageForm = async (param: UpdateAccessParams | AddAccessParams, formRef: Ref<FormInst>) => {
		try {
			const data = { ...param, config: JSON.stringify(param.config) } as UpdateAccessParams<string>
			if ('id' in param) {
				const { id, name, config } = data // 解构出 id, name, config
				await updateExistingAccess({ id: id.toString(), name, config } as UpdateAccessParams<string>)
			} else {
				await addNewAccess(data as AddAccessParams<string>)
			}
		} catch (_) {
			return handleError(new Error($t('t_4_1746667590873')))
		}
	}

	// 使用表单hooks
	const { component: ApiManageForm, fetch } = useForm({
		config,
		defaultValue: param,
		request: submitApiManageForm,
		rules: rules as FormRules,
	})

	// 关联确认按钮
	confirm(async (close) => {
		try {
			openLoad()
			await fetch()
			resetApiForm()
			close()
		} catch (error) {
			return handleError(error)
		} finally {
			closeLoad()
		}
	})

	return {
		ApiManageForm,
	}
}
