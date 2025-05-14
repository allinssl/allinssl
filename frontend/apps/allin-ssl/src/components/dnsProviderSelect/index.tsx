import { NButton, NFormItemGi, NGrid, NSelect, NText, NSpin, NFlex } from 'naive-ui'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import { useStore } from '@layout/useStore'
import SvgIcon from '@components/svgIcon'

interface DnsProviderOption {
	label: string
	value: string
	type: string
}

type DnsProviderType = 'btpanel' | 'aliyun' | 'ssh' | 'tencentcloud' | '1panel' | 'dns' | ''

interface DnsProviderSelectProps {
	// 表单类型，用于获取不同的下拉列表
	type: DnsProviderType
	// 表单，用于绑定表单的值
	path: string
	// 表单的值
	value: string
	// 表单的值类型
	valueType: 'value' | 'type'
	// 是否为添加模式
	isAddMode: boolean
	// 是否禁用
	disabled?: boolean
	// 自定义样式
	customClass?: string
}

/**
 * @component DnsProviderSelect
 * @description DNS提供商选择组件，支持多种DNS提供商类型，并提供刷新和跳转到授权页面的功能
 *
 * @example 基础使用
 * <DnsProviderSelect
 *   type="dns"
 *   path="form.dnsProvider"
 *   v-model:value="formValue.dnsProvider"
 *   valueType="value"
 *   :isAddMode="true"
 * />
 *
 * @example 仅显示选择器（无添加按钮）
 * <DnsProviderSelect
 *   type="aliyun"
 *   path="form.dnsProvider"
 *   v-model:value="formValue.dnsProvider"
 *   valueType="value"
 *   :isAddMode="false"
 * />
 *
 * @example 禁用状态
 * <DnsProviderSelect
 *   type="dns"
 *   path="form.dnsProvider"
 *   v-model:value="formValue.dnsProvider"
 *   valueType="value"
 *   :isAddMode="true"
 *   :disabled="true"
 * />
 *
 * @property {string} type - DNS提供商类型，支持 'btpanel'|'aliyun'|'ssh'|'tencentcloud'|'1panel'|'dns'|''
 * @property {string} path - 表单路径，用于绑定表单的值
 * @property {string} value - 表单的值，通过v-model:value绑定
 * @property {string} valueType - 表单的值类型，可选值为 'value'(默认) 或 'type'
 * @property {boolean} isAddMode - 是否显示添加和刷新按钮，默认为true
 * @property {boolean} disabled - 是否禁用选择器，默认为false
 * @property {string} customClass - 自定义CSS类名
 *
 * @emits update:value - 当选择的DNS提供商变更时触发
 */

export default defineComponent({
	name: 'DnsProviderSelect',
	props: {
		// 表单类型，用于获取不同的下拉列表
		type: {
			type: String as PropType<DnsProviderType>,
			default: '',
		},
		// 表单，用于绑定表单的值
		path: {
			type: String,
			default: '',
		},
		// 表单的值
		value: {
			type: String,
			default: '',
		},
		// 表单的值类型
		valueType: {
			type: String,
			default: 'value',
		},
		// 是否为添加模式
		isAddMode: {
			type: Boolean,
			default: true,
		},
		// 是否禁用
		disabled: {
			type: Boolean,
			default: false,
		},
		// 自定义样式
		customClass: {
			type: String,
			default: '',
		},
	},
	emits: ['update:value'],
	setup(props: DnsProviderSelectProps, { emit }) {
		// 错误处理
		const { handleError } = useError()
		// 获取DNS提供商
		const { fetchDnsProvider, dnsProvider } = useStore()
		// 表单的值
		const param = ref<DnsProviderOption>({
			label: '',
			value: '',
			type: '',
		})
		const dnsProviderRef = ref<DnsProviderOption[]>([])
		// 加载状态
		const isLoading = ref(false)
		// 错误信息
		const errorMessage = ref('')

		console.log(props.type)

		/**
		 * @description 跳转到DNS提供商授权页面
		 */
		const goToAddDnsProvider = () => {
			window.open('/auth-api-manage', '_blank')
		}

		/**
		 * 渲染单选标签
		 * @param option - 选项
		 * @returns 渲染后的VNode
		 */
		const renderSingleSelectTag = ({ option }: Record<string, any>): VNode => {
			return (
				<div class="flex items-center">
					{option.label ? (
						renderLabel(option)
					) : (
						<NText class="text-[#aaa]">
							{props.type === 'dns' ? $t('t_0_1747019621052', []) : $t('t_0_1746858920894')}
						</NText>
					)}
				</div>
			)
		}

		/**
		 * 渲染标签
		 * @param option - 选项
		 * @returns 渲染后的VNode
		 */
		const renderLabel = (option: { type: string; label: string }): VNode => {
			return (
				<NFlex>
					<SvgIcon icon={`resources-${option.type}`} size="2rem" />
					<NText>{option.label}</NText>
				</NFlex>
			)
		}

		/**
		 * @description 更新类型
		 */
		const handleUpdateType = async () => {
			const items = dnsProvider.value.find((item) => {
				return item.value === param.value.value
			})
			if (items) {
				param.value = {
					label: items.label,
					value: items.value,
					type: items.type,
				}
			}
			if (dnsProvider.value.length > 0 && param.value.value === '') {
				param.value = {
					label: dnsProvider.value[0]?.label || '',
					value: dnsProvider.value[0]?.value || '',
					type: dnsProvider.value[0]?.type || '',
				}
			}
			emit('update:value', param.value)
		}

		/**
		 * 更新表单的值
		 * @param value - 表单的值
		 */
		const handleUpdateValue = (value: string) => {
			param.value.value = value
			handleUpdateType()
		}

		/**
		 * @description 加载DNS提供商选项
		 */
		const loadDnsProviders = async (type: DnsProviderType = '') => {
			isLoading.value = true
			errorMessage.value = ''

			try {
				await fetchDnsProvider(type)
			} catch (error) {
				errorMessage.value = typeof error === 'string' ? error : $t('t_0_1746760933542')
				handleError(error)
			} finally {
				isLoading.value = false
			}
		}

		/**
		 * @description 搜索过滤函数
		 * @param pattern - 搜索文本
		 * @param option - 选项
		 */
		const handleFilter = (pattern: string, option: any) => {
			return option.label.toLowerCase().includes(pattern.toLowerCase())
		}

		// 监听消息通知提供商
		watch(
			() => dnsProvider.value,
			(newVal) => {
				dnsProviderRef.value =
					newVal.map((item) => ({
						label: item.label,
						value: props.valueType === 'value' ? item.value : item.type,
						type: props.valueType === 'value' ? item.type : item.value,
					})) || []
				handleUpdateType()
			},
		)

		// 监听父组件的值
		watch(
			() => props.value,
			() => {
				// loadDnsProviders(props.type)
				handleUpdateValue(props.value)
			},
			{ immediate: true },
		)

		onMounted(() => {
			loadDnsProviders(props.type)
		})

		return () => (
			<NSpin show={isLoading.value}>
				<NGrid cols={24} class={props.customClass}>
					<NFormItemGi
						span={props.isAddMode ? 13 : 24}
						label={props.type === 'dns' ? $t('t_3_1745735765112') : $t('t_0_1746754500246')}
						path={props.path}
					>
						<NSelect
							class="flex-1 w-full"
							options={dnsProviderRef.value}
							renderLabel={renderLabel}
							renderTag={renderSingleSelectTag}
							filterable
							filter={handleFilter}
							placeholder={props.type === 'dns' ? $t('t_3_1745490735059') : $t('t_0_1746858920894')}
							v-model:value={param.value.value}
							onUpdateValue={handleUpdateValue}
							disabled={props.disabled}
							v-slots={{
								empty: () => {
									return (
										<span class="text-[1.4rem]">
											{errorMessage.value || (props.type === 'dns' ? $t('t_1_1746858922914') : $t('t_2_1746858923964'))}
										</span>
									)
								},
							}}
						/>
					</NFormItemGi>
					{props.isAddMode && (
						<NFormItemGi span={11}>
							<NButton class="mx-[8px]" onClick={goToAddDnsProvider} disabled={props.disabled}>
								{props.type === 'dns' ? $t('t_1_1746004861166') : $t('t_3_1746858920060')}
							</NButton>
							<NButton onClick={() => loadDnsProviders(props.type)} loading={isLoading.value} disabled={props.disabled}>
								{$t('t_0_1746497662220')}
							</NButton>
						</NFormItemGi>
					)}
				</NGrid>
			</NSpin>
		)
	},
})
