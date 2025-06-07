import { defineComponent, VNode } from 'vue'
import { NButton, NFormItemGi, NGrid, NSelect, NText, NSpin, NFlex } from 'naive-ui'

// 类型导入
import type { CAProviderSelectProps, CAProviderOption, CAProviderSelectEmits } from './types'

// 绝对内部导入 - Controller
import { useCAProviderSelectController } from './useController'
// 绝对内部导入 - Components
import SvgIcon from '@components/SvgIcon'
// 绝对内部导入 - Utilities
import { $t } from '@locales/index'

/**
 * @component CAProviderSelect
 * @description CA授权选择组件，支持选择Let's Encrypt和其他CA授权，并提供跳转到CA授权管理页面的功能。
 *              遵循 MVC/MV* 模式，将业务逻辑、状态管理与视图渲染分离。
 *
 * @example 基础使用
 * <CAProviderSelect
 *   path="form.eabId"
 *   v-model:value="formValue.eabId"
 *   v-model:ca="formValue.ca"
 *   v-model:email="formValue.email"
 * />
 *
 * @property {string} path - 表单路径，用于表单校验。
 * @property {string} value - 当前选中的值 (通过 v-model:value 绑定)。
 * @property {string} ca - 当前选中的CA类型 (通过 v-model:ca 绑定)。
 * @property {string} email - 邮箱地址 (通过 v-model:email 绑定)，当 value 不为空时会被自动赋值。
 * @property {boolean} [disabled=false] - 是否禁用。
 * @property {string} [customClass] - 自定义CSS类名。
 *
 * @emits update:value - (value: { value: string; ca: string }) 当选择的CA授权变更时触发，传递值和CA类型。
 * @emits update:email - (email: string) 当 value 不为空时触发，传递邮箱地址。
 */
export default defineComponent<CAProviderSelectProps>({
	name: 'CAProviderSelect',
	props: {
		path: {
			type: String,
			required: true,
		},
		value: {
			type: String,
			required: true,
			default: '',
		},
		ca: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
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
	emits: {
		'update:value': (value: { value: string; ca: string }) => true,
		'update:email': (email: string) => true,
	},
	setup(props: CAProviderSelectProps, { emit }: { emit: CAProviderSelectEmits }) {
		const {
			isLoading,
			caProviderRef,
			param,
			handleUpdateValue,
			handleFilter,
			goToAddCAProvider,
			errorMessage,
			loadCAProviders,
		} = useCAProviderSelectController(props, emit)

		/**
		 * 渲染标签
		 * @param option - 选项
		 * @returns 渲染后的VNode
		 */
		const renderLabel = (option: CAProviderOption): VNode => {
			return (
				<NFlex align="center">
					<SvgIcon icon={`cert-${option.ca}`} size="2rem" />
					<NText>{option.label}</NText>
				</NFlex>
			)
		}

		/**
		 * 渲染单选标签
		 * @param option - 选项 (Record<string, any> 来自 naive-ui 的类型)
		 * @returns 渲染后的VNode
		 */
		const renderSingleSelectTag = ({ option }: { option: CAProviderOption }): VNode => {
			return (
				<div class="flex items-center">
					{option.label ? renderLabel(option) : <NText class="text-[#aaa]">{$t('t_0_1747990228780')}</NText>}
				</div>
			)
		}

		return () => (
			<NSpin show={isLoading.value}>
				<NGrid cols={24} class={props.customClass}>
					<NFormItemGi span={13} label={$t('t_0_1748052857931')} path={props.path}>
						<NSelect
							class="flex-1 w-full"
							options={caProviderRef.value}
							renderLabel={renderLabel}
							renderTag={({ option }: { option: unknown }) =>
								renderSingleSelectTag({ option: option as CAProviderOption })
							}
							filterable
							filter={(pattern: string, option: unknown) => handleFilter(pattern, option as CAProviderOption)}
							placeholder={$t('t_0_1747990228780')}
							value={param.value.value} // 使用 controller 中的 param.value.value
							onUpdateValue={handleUpdateValue}
							disabled={props.disabled}
							v-slots={{
								header: () => {
									return (
										<div
											class="flex items-center cursor-pointer hover:text-[#333] hover:bg-[#eee]"
											onClick={() => goToAddCAProvider('addCAForm')}
										>
											{$t('t_1_1748052860539')}
										</div>
									)
								},
								empty: () => {
									return <span class="text-[1.4rem]">{errorMessage.value || $t('t_2_1747990228008')}</span>
								},
							}}
						/>
					</NFormItemGi>
					<NFormItemGi span={11}>
						<NButton class="mx-[8px]" onClick={() => goToAddCAProvider('caManage')} disabled={props.disabled}>
							{$t('t_0_1747903670020')}
						</NButton>
						<NButton onClick={() => loadCAProviders()} loading={isLoading.value} disabled={props.disabled}>
							{$t('t_0_1746497662220')}
						</NButton>
					</NFormItemGi>
				</NGrid>
			</NSpin>
		)
	},
})
