import { defineComponent, PropType, VNode } from 'vue'
import { NButton, NFormItemGi, NGrid, NSelect, NText, NSpin, NFlex } from 'naive-ui'

// 类型导入
import type { DnsProviderSelectProps, DnsProviderOption, DnsProviderType, DnsProviderSelectEmits } from './types'

// 绝对内部导入 - Controller
import { useDnsProviderSelectController } from './useController'
// 绝对内部导入 - Components
import SvgIcon from '@components/SvgIcon'
// 绝对内部导入 - Utilities
import { $t } from '@locales/index'

/**
 * @component DnsProviderSelect
 * @description DNS提供商选择组件，支持多种DNS提供商类型，并提供刷新和跳转到授权页面的功能。
 *              遵循 MVC/MV* 模式，将业务逻辑、状态管理与视图渲染分离。
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
 * @property {DnsProviderType} type - DNS提供商类型。
 * @property {string} path - 表单路径，用于表单校验。
 * @property {string} value - 当前选中的值 (通过 v-model:value 绑定)。
 * @property {'value' | 'type'} valueType - 表单值的类型，决定 emit 'update:value' 时传递的是选项的 'value' 还是 'type'。
 * @property {boolean} isAddMode - 是否为添加模式，显示添加和刷新按钮。
 * @property {boolean} [disabled=false] - 是否禁用。
 * @property {string} [customClass] - 自定义CSS类名。
 *
 * @emits update:value - (value: DnsProviderOption) 当选择的DNS提供商变更时触发，传递整个选项对象。
 */
export default defineComponent<DnsProviderSelectProps>({
	name: 'DnsProviderSelect',
	props: {
		type: {
			type: String as PropType<DnsProviderType>,
			required: true,
		},
		path: {
			type: String,
			required: true,
		},
		value: {
			type: String,
			required: true,
		},
		valueType: {
			type: String as PropType<'value' | 'type'>,
			default: 'value',
		},
		isAddMode: {
			type: Boolean,
			default: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		customClass: {
			type: String,
			default: '',
		},
	},
	emits: ['update:value'] as unknown as DnsProviderSelectEmits, // 类型断言以匹配严格的 emits 定义

	setup(props: DnsProviderSelectProps, { emit }: { emit: DnsProviderSelectEmits }) {
		const controller = useDnsProviderSelectController(props, emit)

		/**
		 * 渲染标签
		 * @param option - 选项
		 * @returns 渲染后的VNode
		 */
		const renderLabel = (option: DnsProviderOption): VNode => {
			return (
				<NFlex align="center">
					<SvgIcon icon={`resources-${option.type}`} size="2rem" />
					<NText>{option.label}</NText>
				</NFlex>
			)
		}

		/**
		 * 渲染单选标签
		 * @param option - 选项 (Record<string, any> 来自 naive-ui 的类型)
		 * @returns 渲染后的VNode
		 */
		const renderSingleSelectTag = ({ option }: { option: DnsProviderOption }): VNode => {
			return (
				<div class="flex items-center">
					{option.label ? (
						renderLabel(option)
					) : (
						<NText class="text-[#aaa]">
							{props.type === 'dns' ? $t('t_0_1747019621052') : $t('t_0_1746858920894')}
						</NText>
					)}
				</div>
			)
		}

		return () => (
			<NSpin show={controller.isLoading.value}>
				<NGrid cols={24} class={props.customClass}>
					<NFormItemGi
						span={props.isAddMode ? 13 : 24}
						label={props.type === 'dns' ? $t('t_3_1745735765112') : $t('t_0_1746754500246')}
						path={props.path}
					>
						<NSelect
							class="flex-1 w-full"
							filterable
							options={controller.dnsProviderRef.value}
							renderLabel={renderLabel}
							renderTag={({ option }: { option: any }) =>
								renderSingleSelectTag({ option: option as DnsProviderOption })
							}
							filter={(pattern: string, option: any) => controller.handleFilter(pattern, option as DnsProviderOption)}
							placeholder={props.type === 'dns' ? $t('t_3_1745490735059') : $t('t_0_1746858920894')}
							value={controller.param.value.value} // 使用 controller 中的 param.value.value
							onUpdateValue={controller.handleUpdateValue}
							disabled={props.disabled}
							v-slots={{
								empty: () => {
									return (
										<span class="text-[1.4rem]">
											{controller.errorMessage.value ||
												(props.type === 'dns' ? $t('t_1_1746858922914') : $t('t_2_1746858923964'))}
										</span>
									)
								},
							}}
						/>
					</NFormItemGi>
					{props.isAddMode && (
						<NFormItemGi span={11}>
							<NButton class="mx-[8px]" onClick={controller.goToAddDnsProvider} disabled={props.disabled}>
								{props.type === 'dns' ? $t('t_1_1746004861166') : $t('t_3_1746858920060')}
							</NButton>
							<NButton
								onClick={() => controller.loadDnsProviders(props.type)}
								loading={controller.isLoading.value}
								disabled={props.disabled}
							>
								{$t('t_0_1746497662220')}
							</NButton>
						</NFormItemGi>
					)}
				</NGrid>
			</NSpin>
		)
	},
})
