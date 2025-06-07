import { NFormItem, NInputNumber, NSwitch } from 'naive-ui'
import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { useStore } from '@components/FlowChart/useStore'
import { $t } from '@locales/index'
import rules from './verify'
import DnsProviderSelect from '@components/DnsProviderSelect'
import CAProviderSelect from '@components/CAProviderSelect'
import type { ApplyNodeConfig } from '@components/FlowChart/types'
import { deepClone } from '@baota/utils/data'
import { noSideSpace } from '@lib/utils'

export default defineComponent({
	name: 'ApplyNodeDrawer',
	props: {
		// 节点配置数据
		node: {
			type: Object as PropType<{ id: string; config: ApplyNodeConfig }>,
			default: () => ({
				id: '',
				config: {
					domains: '',
					email: '',
					eabId: '',
					ca: '',
					proxy: '',
					provider_id: '',
					provider: '',
					end_day: 30,
					name_server: '',
					skip_check: 0,
					algorithm: 'RSA2048',
					close_cname: 0,
					max_wait: undefined,
					ignore_check: 0,
				},
			}),
		},
	},
	setup(props) {
		const { updateNodeConfig, advancedOptions, isRefreshNode } = useStore()
		// 弹窗辅助
		const { confirm } = useModalHooks()
		// 获取表单助手函数
		const { useFormInput, useFormSelect, useFormMore, useFormHelp, useFormSwitch } = useFormHooks()
		// 表单参数
		const param = ref(deepClone(props.node.config))

		// 表单渲染配置
		const config = computed(() => {
			// 基本选项
			return [
				useFormInput($t('t_17_1745227838561'), 'domains', {
					placeholder: $t('t_0_1745735774005'),
					allowInput: noSideSpace,
					onInput: (val: string) => {
						param.value.domains = val.replace(/，/g, ',').replace(/;/g, ',') // 中文逗号分隔
					},
				}),
				{
					type: 'custom' as const,
					render: () => {
						return (
							<DnsProviderSelect
								type="dns"
								path="provider_id"
								value={param.value.provider_id}
								valueType="value"
								isAddMode={true}
								{...{
									'onUpdate:value': (val: { value: string; type: string }) => {
										param.value.provider_id = val.value
										param.value.provider = val.type
									},
								}}
							/>
						)
					},
				},
				{
					type: 'custom' as const,
					render: () => {
						return (
							<CAProviderSelect
								path="eabId"
								value={param.value.eabId}
								email={param.value.email}
								ca={param.value.ca}
								{...{
									'onUpdate:value': (val: { value: string; ca: string; email: string }) => {
										param.value.eabId = val.value
										param.value.ca = val.ca
										// 始终更新邮件，确保 Let's Encrypt 和 Buypass 的邮件能正确显示
										param.value.email = val.email
									},
								}}
							/>
						)
					},
				},
				useFormInput($t('t_68_1745289354676'), 'email', {
					placeholder: $t('t_2_1748052862259'),
					allowInput: noSideSpace,
				}),

				{
					type: 'custom' as const,
					render: () => {
						return (
							<NFormItem label={$t('t_4_1747990227956')} path="end_day">
								<div class="flex items-center">
									<span class="text-[1.4rem] mr-[1.2rem]">{$t('t_5_1747990228592')}</span>
									<NInputNumber v-model:value={param.value.end_day} showButton={false} min={1} class="w-[120px]" />
									<span class="text-[1.4rem] ml-[1.2rem]">{$t('t_6_1747990228465')}</span>
								</div>
							</NFormItem>
						)
					},
				},
				useFormMore(advancedOptions),
				...(advancedOptions.value
					? [
							useFormSelect(
								$t('t_0_1747647014927'),
								'algorithm',
								[
									{ label: 'RSA2048', value: 'RSA2048' },
									{ label: 'RSA3072', value: 'RSA3072' },
									{ label: 'RSA4096', value: 'RSA4096' },
									{ label: 'RSA8192', value: 'RSA8192' },
									{ label: 'EC256', value: 'EC256' },
									{ label: 'EC384', value: 'EC384' },
								],
								{},
								{ showRequireMark: false },
							),
							useFormInput(
								$t('t_7_1747990227761'),
								'proxy',
								{
									placeholder: $t('t_8_1747990235316'),
									allowInput: noSideSpace,
								},
								{ showRequireMark: false },
							),
							useFormSwitch(
								$t('t_2_1749204567193'),
								'close_cname',
								{
									checkedValue: 1,
									uncheckedValue: 0,
								},
								{ showRequireMark: false },
							),
							useFormSwitch(
								$t('t_2_1747106957037'),
								'skip_check',
								{
									checkedValue: 1,
									uncheckedValue: 0,
								},
								{ showRequireMark: false },
							),
							// 只有在跳过预检查关闭时才显示DNS递归服务器、预检查超时时间和忽略预检查结果
							...(param.value.skip_check === 0
								? [
										useFormInput(
											$t('t_0_1747106957037'),
											'name_server',
											{
												placeholder: $t('t_1_1747106961747'),
												allowInput: noSideSpace,
												onInput: (val: string) => {
													param.value.name_server = val.replace(/，/g, ',').replace(/;/g, ',') // 中文逗号分隔
												},
											},
											{ showRequireMark: false },
										),
										{
											type: 'custom' as const,
											render: () => {
												return (
													<NFormItem label={$t('t_0_1749263105073')} path="max_wait">
														<NInputNumber
															v-model:value={(param.value as ApplyNodeConfig & { max_wait?: number }).max_wait}
															showButton={false}
															min={1}
															class="w-full"
															placeholder={$t('t_1_1749263104936')}
														/>
													</NFormItem>
												)
											},
										},
										{
											type: 'custom' as const,
											render: () => {
												return (
													<NFormItem label={$t('t_2_1749263103765')} path="ignore_check">
														<div class="flex items-center">
															<span class="text-[1.4rem] mr-[1.2rem]">{$t('t_3_1749263104237')}</span>
															<NSwitch
																v-model:value={param.value.ignore_check}
																checkedValue={1}
																uncheckedValue={0}
																class="mx-[.5rem]"
																v-slots={{
																	checked: () => $t('t_4_1749263101853'),
																	unchecked: () => $t('t_5_1749263101934'),
																}}
															/>
															<span class="text-[1.4rem] ml-[1.2rem]">{$t('t_6_1749263103891')}</span>
														</div>
													</NFormItem>
												)
											},
										},
									]
								: []),
						]
					: []),
				useFormHelp([
					{
						content: $t('t_0_1747040228657'),
					},
					{
						content: $t('t_1_1747040226143'),
					},
				]),
			]
		})

		// 创建表单实例
		const { component: Form, data, example } = useForm<ApplyNodeConfig>({ defaultValue: param, config, rules })

		onMounted(() => {
			advancedOptions.value = false
		})

		// 确认事件触发
		confirm(async (close) => {
			try {
				await example.value?.validate()

				updateNodeConfig(props.node.id, data.value) // 更新节点配置
				isRefreshNode.value = props.node.id // 刷新节点
				close()
			} catch (error) {
				console.log(error)
			}
		})

		return () => (
			<div class="apply-node-drawer">
				<Form labelPlacement="top" />
			</div>
		)
	},
})
