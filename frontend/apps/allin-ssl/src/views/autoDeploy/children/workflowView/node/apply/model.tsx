import {
	NFormItem,
	NInputNumber,
	NSwitch,
	NSelect,
	NAutoComplete,
	NInput,
	NFlex,
	NText,
	NButton,
	NGrid,
	NFormItemGi,
	NSpin,
	NDropdown,
} from 'naive-ui'
import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { useStore } from '@components/FlowChart/useStore'
import { $t } from '@locales/index'
import rules from './verify'
import DnsProviderSelect from '@components/DnsProviderSelect'
import type { ApplyNodeConfig } from '@components/FlowChart/types'
import { deepClone } from '@baota/utils/data'
import { noSideSpace } from '@lib/utils'
import { getEabList } from '@api/access'
import SvgIcon from '@components/SvgIcon'
import { CACertificateAuthorization } from '@config/data'

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

		// CA选项状态
		const caOptions = ref<Array<{ label: string; value: string; icon: string }>>([])
		const emailOptions = ref<string[]>([])
		const isLoadingCA = ref(false)
		const isLoadingEmails = ref(false)
		const showEmailDropdown = ref(false)
		const emailInputRef = ref<any>(null)

		// 加载CA选项
		const loadCAOptions = async () => {
			isLoadingCA.value = true
			try {
				const { data } = await getEabList({ ca: '', p: 1, limit: 1000 }).fetch()
				const uniqueCATypes = new Set<string>()
				const caList: Array<{ label: string; value: string; icon: string }> = []

				// 优先添加重要的CA类型（确保始终显示）
				const priorityCATypes = ['letsencrypt', 'buypass', 'zerossl']
				priorityCATypes.forEach((caType) => {
					if (!uniqueCATypes.has(caType)) {
						uniqueCATypes.add(caType)
						const predefinedCA = Object.values(CACertificateAuthorization).find((ca) => ca.type === caType)
						caList.push({
							label: predefinedCA ? predefinedCA.name : caType.toUpperCase(),
							value: caType,
							icon: `cert-${caType}`,
						})
					}
				})

				// 添加API返回的其他CA类型（去重）
				data?.forEach((item) => {
					if (item.ca && !uniqueCATypes.has(item.ca)) {
						uniqueCATypes.add(item.ca)

						// 查找预定义配置中对应的CA信息
						const predefinedCA = Object.values(CACertificateAuthorization).find((ca) => ca.type === item.ca)
						caList.push({
							label: predefinedCA ? predefinedCA.name : item.ca.toUpperCase(),
							value: item.ca,
							icon: predefinedCA ? `cert-${item.ca}` : 'cert-custom', // 如果不在预定义配置中，使用custom图标；否则使用对应的cert图标
						})
					}
				})

				caOptions.value = caList
			} catch (error) {
				console.error('加载CA选项失败:', error)
			} finally {
				isLoadingCA.value = false
			}
		}

		// 加载邮件选项
		const loadEmailOptions = async (ca: string) => {
			if (!ca) return
			isLoadingEmails.value = true
			try {
				const { data } = await getEabList({ ca, p: 1, limit: 1000 }).fetch()
				emailOptions.value = data?.map((item) => item.email).filter(Boolean) || []
				if (!emailOptions.value.length) {
					param.value.email = ''
				}
				// 如果邮箱数组有内容且当前邮箱为空，自动填充第一个邮箱地址
				if (emailOptions.value.length > 0 && emailOptions.value[0]) {
					param.value.email = emailOptions.value[0]
				}
			} catch (error) {
				console.error('加载邮件选项失败:', error)
			} finally {
				isLoadingEmails.value = false
			}
		}

		// 处理CA选择变化
		const handleCAChange = (value: string) => {
			param.value.ca = value
			loadEmailOptions(value)
		}

		// 跳转到CA管理页面
		const goToAddCAProvider = () => {
			window.open('/auto-deploy?type=caManage', '_blank')
		}

		// 渲染CA选择器标签
		const renderLabel = (option: { label: string; value: string; icon: string }) => {
			return (
				<NFlex align="center">
					<SvgIcon icon={option.icon} size="2rem" />
					<NText>{option.label}</NText>
				</NFlex>
			)
		}

		// 渲染CA选择器单选标签
		const renderSingleSelectTag = ({ option }: { option: any }) => {
			return (
				<NFlex align="center">
					{option.label ? renderLabel(option) : <NText class="text-[#aaa]">{$t('t_0_1747990228780')}</NText>}
				</NFlex>
			)
		}

		// 过滤函数
		const handleFilter = (pattern: string, option: any): boolean => {
			return option.label.toLowerCase().includes(pattern.toLowerCase())
		}

		// 处理邮箱输入框焦点
		const handleEmailFocus = () => {
			if (emailOptions.value.length > 0) {
				showEmailDropdown.value = true
			}
		}

		// 处理邮箱输入框失焦
		const handleEmailBlur = () => {
			// 延迟关闭下拉，确保点击选项有时间触发
			setTimeout(() => {
				showEmailDropdown.value = false
			}, 200)
		}

		// 选择邮箱地址
		const handleSelectEmail = (email: string) => {
			param.value.email = email
			showEmailDropdown.value = false
			emailInputRef.value?.blur()
		}

		// 创建邮箱下拉选项
		const emailDropdownOptions = computed(() => {
			return emailOptions.value.map((email) => ({
				label: email,
				key: email,
			}))
		})

		// 判断是否需要输入框（letsencrypt、buypass、zerossl）
		const shouldUseInputForEmail = computed(() => {
			return ['letsencrypt', 'buypass', 'zerossl'].includes(param.value.ca)
		})

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
							<NSpin show={isLoadingCA.value}>
								<NGrid cols={24}>
									<NFormItemGi span={13} label={$t('t_3_1750399513606')} path="ca" showRequireMark={true}>
										<NSelect
											value={param.value.ca}
											options={caOptions.value}
											renderLabel={renderLabel}
											renderTag={renderSingleSelectTag}
											filterable
											filter={handleFilter}
											loading={isLoadingCA.value}
											placeholder={$t('t_0_1747990228780')}
											onUpdateValue={handleCAChange}
											class="flex-1 w-full"
											v-slots={{
												empty: () => {
													return <span class="text-[1.4rem]">{$t('t_2_1747990228008')}</span>
												},
											}}
										/>
									</NFormItemGi>
									<NFormItemGi span={11}>
										<NButton class="mx-[8px]" onClick={goToAddCAProvider}>
											{$t('t_4_1747903685371')}
										</NButton>
										<NButton onClick={loadCAOptions} loading={isLoadingCA.value}>
											{$t('t_0_1746497662220')}
										</NButton>
									</NFormItemGi>
								</NGrid>
							</NSpin>
						)
					},
				},
				{
					type: 'custom' as const,
					render: () => {
						return (
							<NFormItem label={$t('t_68_1745289354676')} path="email">
								{shouldUseInputForEmail.value ? (
									<NDropdown
										trigger="manual"
										show={showEmailDropdown.value}
										options={emailDropdownOptions.value}
										onSelect={handleSelectEmail}
										placement="bottom-start"
										style="width: 100%"
									>
										<NInput
											ref={emailInputRef}
											v-model:value={param.value.email}
											placeholder={$t('t_2_1748052862259')}
											clearable
											loading={isLoadingEmails.value}
											onFocus={handleEmailFocus}
											onBlur={handleEmailBlur}
											class="w-full"
										/>
									</NDropdown>
								) : (
									<NSelect
										v-model:value={param.value.email}
										options={emailOptions.value.map((email) => ({ label: email, value: email }))}
										placeholder={$t('t_2_1748052862259')}
										clearable
										filterable
										loading={isLoadingEmails.value}
										class="w-full"
									/>
								)}
							</NFormItem>
						)
					},
				},

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

		// 监听CA值变化，自动加载邮箱选项
		watch(
			() => param.value.ca,
			async (newCA) => {
				if (newCA) {
					await loadEmailOptions(newCA)
				} else {
					emailOptions.value = []
					param.value.email = ''
					showEmailDropdown.value = false
				}
			},
		)

		// 监听邮箱选项变化，如果当前下拉显示且没有选项了就关闭下拉
		watch(
			() => emailOptions.value,
			(newOptions) => {
				if (showEmailDropdown.value && newOptions.length === 0) {
					showEmailDropdown.value = false
				}
			},
		)

		onMounted(async () => {
			advancedOptions.value = false
			await loadCAOptions()
			// 如果初始化时已有CA值，加载对应的邮箱选项
			if (param.value.ca) {
				await loadEmailOptions(param.value.ca)
			}
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
