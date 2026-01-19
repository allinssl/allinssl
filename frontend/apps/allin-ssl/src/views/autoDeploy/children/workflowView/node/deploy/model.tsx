import { NButton, NCard, NStep, NSteps, NText, NTooltip, NTabs, NTabPane, NInput, NDivider, NFormItem } from 'naive-ui'
import { useForm, useModalClose, useModalOptions, useMessage } from '@baota/naive-ui/hooks'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { useError } from '@baota/hooks/error'
import { useStore } from '@components/flowChart/useStore'
import { getSites, getPlugins } from '@api/access'

import { $t } from '@locales/index'
import { deepClone } from '@baota/utils/data'

import verifyRules from './verify'
import { createNodeFormConfig, FormOption } from '@workflowView/lib/NodeFormConfig'
import {
	DeployCategories,
	getDeployTypeOptions,
	getDeployTabOptions,
	getLocalProviderOptions,
	filterDeployTypeOptions,
} from '@workflowView/lib/DeployUtils'

import SvgIcon from '@components/svgIcon'
import DnsProviderSelect from '@/components/dnsProviderSelect'
import SearchOutlined from '@vicons/antd/es/SearchOutlined'

import type { DeployNodeConfig, DeployNodeInputsConfig } from '@components/flowChart/types'
import type { DnsProviderType } from '@/components/dnsProviderSelect/types'
import type { VNode } from 'vue'

import styles from './index.module.css'

type StepStatus = 'process' | 'wait' | 'finish' | 'error'

// 参数配置接口
interface ParamConfig {
	name: string
	type: string
	description?: string
	required?: boolean
	default?: any
	options?: any[]
	rows?: number
}

// 插件方法选项接口
interface PluginActionOption {
	value: string
	label: string
	params?: ParamConfig[]
}

// 需要异步加载网站选择器的提供商类型
const SITE_SELECTOR_PROVIDERS = ['btpanel-site', '1panel-site']
// 需要多选网站的提供商类型
const MULTIPLE_SITE_PROVIDERS = ['btpanel-site']

/**
 * 部署节点抽屉组件
 */
export default defineComponent({
	name: 'DeployNodeDrawer',
	props: {
		// 节点配置数据
		node: {
			type: Object as PropType<{ id: string; config: DeployNodeConfig; inputs: DeployNodeInputsConfig[] }>,
			default: () => ({
				id: '',
				inputs: [],
				config: {
					provider: '',
					provider_id: '',
					inputs: {
						fromNodeId: '',
						name: '',
					},
					skip: 1,
				},
			}),
		},
	},
	setup(props) {
		const { updateNode, updateNodeConfig, findApplyUploadNodesUp, isRefreshNode } = useStore()
		// 样式支持
		const cssVar = useThemeCssVar(['primaryColor', 'borderColor'])
		// 错误处理
		const { handleError } = useError()
		// 消息处理
		const message = useMessage()
		// 弹窗配置
		const modalOptions = useModalOptions()
		// 弹窗关闭
		const closeModal = useModalClose()
		// 表单配置工厂
		const formConfig = createNodeFormConfig()

		// 部署类型选项
		const deployTypeOptions = getDeployTypeOptions()
		// 部署类型标签选项
		const deployTabOptions = getDeployTabOptions()
		// 证书选项
		const certOptions = ref<FormOption[]>([])
		// 网站选项（用于btpanel-site类型）
		const siteOptions = ref<FormOption[]>([])
		// 网站选项加载状态
		const siteOptionsLoading = ref(false)
		// 插件选项
		const pluginOptions = ref<FormOption[]>([])
		// 插件方法选项
		const pluginActionOptions = ref<FormOption[]>([])
		// 插件方法选项加载状态
		const pluginActionOptionsLoading = ref(false)
		// 当前步骤
		const current = ref(1)
		// 是否是下一步
		const next = ref(true)
		// 当前步骤状态
		const currentStatus = ref<StepStatus>('process')
		// 当前选中的tab
		const currentTab = ref(DeployCategories.ALL)
		// 搜索关键字
		const searchKeyword = ref('')
		// 是否已初始化（用于区分初始化和重新选择类型）
		const isInitialized = ref(false)

		// 插件方法提示
		const pluginActionTips = ref('')
		// 当前动态参数配置
		const currentDynamicParams = ref<any[]>([])
		// 配置模式 (default: 默认模式显示动态表单+自定义参数, custom: 自定义模式只显示自定义参数)
		const configMode = ref<'default' | 'custom'>('default')

		// 表单参数
		const param = ref(deepClone(props.node.config))
		// 确保param对象中包含configMode属性，如果已有值则保留，否则设置为默认值
		if (!param.value.configMode) {
			param.value.configMode = 'default'
		}
		// 本地提供商
		const localProvider = ref(getLocalProviderOptions())
		// 提供商描述
		const provider = computed((): string => {
			return param.value.provider
				? $t('t_4_1746858917773') + '：' + deployTypeOptions.find((item) => item.value === param.value.provider)?.label
				: $t('t_19_1745735766810')
		})

		// 过滤后的部署类型选项
		const filteredDeployTypes = computed((): FormOption[] => {
			return filterDeployTypeOptions(deployTypeOptions, currentTab.value, searchKeyword.value)
		})

		// 表单配置
		const nodeFormConfig = computed(() => {
			const config = []
			// 部署提供商选择
			if (param.value.provider !== 'localhost') {
				config.push(
					formConfig.custom(() => {
						// 创建props对象
						const dnsProviderProps = {
							type: param.value.provider as DnsProviderType,
							path: 'provider_id',
							value: param.value.provider_id,
							valueType: 'value' as const,
							isAddMode: true,
							'onUpdate:value': (val: { value: number | string; type: string; data: string }) => {
								if (
									val.value !== '' &&
									param.value.provider_id !== '' &&
									param.value.provider_id !== val.value &&
									SITE_SELECTOR_PROVIDERS.includes(param.value.provider)
								) {
									param.value.provider === '1panel-site'
										? (param.value.site_id = MULTIPLE_SITE_PROVIDERS.includes(param.value.provider) ? [] : '')
										: (param.value.siteName = MULTIPLE_SITE_PROVIDERS.includes(param.value.provider) ? [] : '')
								}
								param.value.provider_id = val.value
								param.value.type = val.type
								param.value.provider_data = val?.data || ''
							},
						}
						return (<DnsProviderSelect {...dnsProviderProps} />) as VNode
					}),
				)
			} else {
				config.push(formConfig.select($t('t_0_1746754500246'), 'provider', localProvider.value))
			}

			// 证书来源选择
			config.push(
				formConfig.select($t('t_1_1745748290291'), 'inputs.fromNodeId', certOptions.value, {
					onUpdateValue: (val: string, option: { label: string; value: string }) => {
						param.value.inputs.fromNodeId = val
						param.value.inputs.name = option?.label
					},
				}),
			)

			// 根据不同的部署类型添加不同的表单配置
			switch (param.value.provider) {
				case 'localhost':
				case 'ssh':
					config.push(...formConfig.sshDeploy())
					break
				case 'btpanel-site':
				case '1panel-site':
					// 使用异步加载的网站选择器
					config.push(
						formConfig.select(
							$t('t_0_1747296173751'),
							param.value.provider === '1panel-site' ? 'site_id' : 'siteName',
							siteOptions.value,
							{
								placeholder: !MULTIPLE_SITE_PROVIDERS.includes(param.value.provider)
									? $t('t_0_1748586248783')
									: $t('t_10_1747990232207'),
								multiple: MULTIPLE_SITE_PROVIDERS.includes(param.value.provider), // 多选
								filterable: true, // 可过滤
								remote: true, // 远程搜索
								clearable: true, // 可清除
								loading: siteOptionsLoading.value,
								onSearch: handleSiteSearch,
							},
						),
					)
					break
				case 'btwaf-site':
				case 'btpanel-dockersite':
				case 'btpanel-singlesite':
				case 'safeline-site':
					config.push(...formConfig.siteDeploy())
					break
				case 'tencentcloud-cdn':
				case 'tencentcloud-waf':
				case 'tencentcloud-teo':
				case 'aliyun-cdn':
				case 'aliyun-dcdn':
				case 'baidu-cdn':
				case 'qiniu-cdn':
				case 'qiniu-oss':
				case 'huaweicloud-cdn':
				case 'doge-cdn':
					config.push(...formConfig.cdnDeploy())
					break
				case 'volcengine-cdn':
				case 'volcengine-dcdn':
					// 火山引擎CDN和DCDN部署参数
					config.push(
						formConfig.input($t('t_17_1745227838561'), 'domain', { placeholder: $t('t_0_1744958839535') }),
						formConfig.input($t('t_7_1747280808936'), 'region', { placeholder: $t('t_25_1745735766651') }),
					)
					break
				case 'aliyun-waf':
					config.push(...formConfig.wafDeploy())
					break
				case 'tencentcloud-cos':
				case 'aliyun-oss':
					config.push(...formConfig.storageDeploy())
					break
				case 'aliyun-esa':
					config.push(...formConfig.aliyunEsaDeploy())
					break
				case 'lecdn':
					config.push(...formConfig.leCdnDeploy())
					break
				case 'rainyun-sslcenter':
					config.push(...formConfig.rainyunSSLCenterDeploy())
					break
				case 'plugin':
					// 插件部署配置
					config.push(
						formConfig.select('插件方法', 'action', pluginActionOptions.value, {
							placeholder: '请选择插件方法',
							filterable: true,
							clearable: true,
							loading: pluginActionOptionsLoading.value,
							onUpdateValue: (value: string, option: FormOption) => {
								param.value.action = value
								// 清空之前的参数
								param.value.params = {}
								// 重置配置模式为默认（仅在新增模式下）
								if (!props.node.config.configMode) {
									configMode.value = 'default'
								}
								// 更新当前动态参数配置
							const selectedAction = pluginActionOptions.value.find(item => item.value === value) as PluginActionOption
							if (selectedAction?.params) {
								currentDynamicParams.value = selectedAction.params
								pluginActionTips.value = renderPluginActionTips(selectedAction.params)
								
								// 动态更新验证规则 - 参考 authApiManage 的实现方式
								if (configMode.value === 'default') {
									// 清空之前的动态规则
									if (verifyRules.params) {
										Object.keys(verifyRules.params).forEach(key => {
											delete verifyRules.params[key]
										})
									}
									
									// 为新的动态参数添加验证规则
									if (!verifyRules.params) {
										verifyRules.params = {}
									}
									
									selectedAction.params.forEach((paramItem: any) => {
										if (paramItem.required) {
											verifyRules.params[paramItem.name] = {
												required: true,
												message: `请输入${paramItem.description || paramItem.name}`,
												trigger: ['input', 'change']
											}
										}
									})
								}
							} else {
								currentDynamicParams.value = []
								// 清空动态验证规则
								if (verifyRules.params) {
									Object.keys(verifyRules.params).forEach(key => {
										delete verifyRules.params[key]
									})
								}
							}
							},
						})
					)

					// 当action?.params为空数组时，只显示自定义参数文本框
					if (currentDynamicParams.value && currentDynamicParams.value.length === 0) {
						// 只显示自定义参数文本框
						config.push({
							type: 'custom' as const,
							render: () => {
								// 确保params是字符串类型并过滤格式
								if (typeof param.value.params !== 'string') {
									param.value.params = JSON.stringify(param.value.params || {}, null, 0)
								} 
								param.value.params = param.value.params
									.replace(/\r\n/g, '') // 去除Windows换行
									.replace(/\s+/g, ' ') // 将多个空格合并为单个空格
									.trim()   
								return (
									<NFormItem
										label="自定义参数"
										path="params"
										v-slots={{
											label: () => (
												<div>
													<NText>自定义参数</NText>
													<NTooltip
														v-slots={{
															trigger: () => (
																<span class="inline-flex ml-2 -mt-1 cursor-pointer text-base rounded-full w-[14px] h-[14px] justify-center items-center  text-orange-600 border border-orange-600">
																	?
															</span>
														),
													}}
												>
													{pluginActionTips.value}
												</NTooltip>
												</div>
											),
										}}
									>
										<NInput
											type="textarea"
											v-model:value={param.value['params']}
											placeholder={pluginActionTips.value}
											rows={4}
										/>
									</NFormItem>
								)
							},
						})
					} else {
						// 当action?.params有参数时，显示配置模式选择器和动态表单
						// 添加配置模式选择器
						config.push(
							formConfig.radioButton(
								'配置模式',
								'configMode',
								[
									{ label: '默认', value: 'default' },
									{ label: '自定义', value: 'custom' }
								],
								{ showRequireMark: false }
							)
						)
						configMode.value = param.value.configMode || 'default'
						
						// 根据配置模式显示不同的表单
						if (configMode.value === 'default') {
							// 默认模式：只显示动态表单（如果有参数）
							if (currentDynamicParams.value && currentDynamicParams.value.length > 0) {
								const dynamicFields = renderDynamicParamForm(currentDynamicParams.value, formConfig, param)
								config.push(...dynamicFields)
							}
						} else {
							// 自定义模式：只显示自定义参数文本框
							config.push({
								type: 'custom' as const,
								render: () => {
									// 确保params是字符串类型并过滤格式
									if (typeof param.value.params !== 'string') {
										param.value.params = JSON.stringify(param.value.params || {}, null, 0)
									}
									param.value.params = param.value.params
										.replace(/\r\n/g, '') // 去除Windows换行
										.replace(/\s+/g, ' ') // 将多个空格合并为单个空格
										.trim()    
									return (
										<NFormItem
											label="自定义参数"
											path="params"
											v-slots={{
												label: () => (
													<div>
														<NText>自定义参数</NText>
														<NTooltip
															v-slots={{
																trigger: () => (
																	<span class="inline-flex ml-2 -mt-1 cursor-pointer text-base rounded-full w-[14px] h-[14px] justify-center items-center  text-orange-600 border border-orange-600">
																		?
																</span>
															),
														}}
													>
														{pluginActionTips.value}
													</NTooltip>
													</div>
												),
											}}
										>
											<NInput
												type="textarea"
												v-model:value={param.value['params']}
												placeholder={pluginActionTips.value}
												rows={4}
											/>
										</NFormItem>
									)
								},
							})
						}
					}
					break
			}

			// 添加跳过选项
			config.push(formConfig.skipOption(param))
			return config
		})

		watch(
			() => param.value.provider_id,
			(newId, oldId) => {
				handleSiteSearch('')
				// 如果是插件类型且provider_id发生变化，重置配置模式并加载插件方法
				if (param.value.provider === 'plugin' && newId && newId !== oldId) {
					// 重置配置模式为默认（仅在新增模式下）
					if (!props.node.config.configMode) {
						configMode.value = 'default'
					}
					param.value.action = ''
					param.value.params = {}
					pluginActionOptions.value = []
					pluginActionOptionsLoading.value = true
					loadPluginActions()
				}
			},
		)

		// 监听配置模式变化，处理params数据格式转换
		watch(
			() => configMode.value,
			(newMode, oldMode) => {
				if (param.value.provider === 'plugin' && newMode !== oldMode) {
					if (newMode === 'default') {
						// 从自定义模式切换到默认模式：尝试解析JSON字符串为对象
						if (typeof param.value.params === 'string') {
							try {
								const parsedParams = JSON.parse(param.value.params || '{}')
								param.value.params = typeof parsedParams === 'object' && parsedParams !== null ? parsedParams : {}
							} catch (e) {
								// 解析失败，初始化为空对象
								param.value.params = {}
							}
						}
					} else if (newMode === 'custom') {
						// 从默认模式切换到自定义模式：将对象转换为JSON字符串
						if (typeof param.value.params === 'object' && param.value.params !== null) {
							param.value.params = JSON.stringify(param.value.params, null, 2)
						} else if (typeof param.value.params !== 'string') {
							param.value.params = '{}'
						}
					}
				}
			},
		)

		/**
		 * 处理网站搜索
		 * @param query 搜索关键字
		 */
		const handleSiteSearch = useThrottleFn(async (query: string): Promise<void> => {
			if (!SITE_SELECTOR_PROVIDERS.includes(param.value.provider)) return
			if (!param.value.provider_id) return
			try {
				siteOptionsLoading.value = true
				const { data } = await getSites({
					id: param.value.provider_id.toString(),
					type: param.value.provider,
					search: query,
					limit: '100',
				}).fetch()
				siteOptions.value = data?.map(({ siteName, id }: { siteName: string; id: string }) => {
					return {
						label: siteName,
						value: id || siteName,
					}
				})
			} catch (error) {
				handleError(error)
				siteOptions.value = []
			} finally {
				siteOptionsLoading.value = false
			}
		}, 1000)

		/**
		 * @description 渲染插件方法提示
		 */
		const renderPluginActionTips = (tips: Record<string, any>): string => {
			return '请输入JSON格式的参数，例如: ' + JSON.stringify(tips || {})
		}

		/**
		 * 初始化参数字段值
		 */
		const initializeParamValue = (paramRef: Ref<any>, paramItem: ParamConfig): void => {
			// 如果params是字符串（从自定义模式切换过来），尝试解析为对象
			if (typeof paramRef.value.params === 'string') {
				try {
					const parsedParams = JSON.parse(paramRef.value.params || '{}')
					paramRef.value.params = typeof parsedParams === 'object' && parsedParams !== null ? parsedParams : {}
				} catch (e) {
					// 解析失败，初始化为空对象
					paramRef.value.params = {}
				}
			} else if (!paramRef.value.params || typeof paramRef.value.params !== 'object') {
				paramRef.value.params = {}
			}
			if (paramRef.value.params[paramItem.name] === undefined) {
				paramRef.value.params[paramItem.name] = paramItem.default || ''
			}
		}

		/**
		 * 获取表单字段通用配置
		 */
		const getFieldConfig = (paramItem: ParamConfig, inputType: 'input' | 'select' = 'input') => {
			const isRequired = paramItem.required || false
			const placeholder = paramItem.description || (inputType === 'select' ? `请选择${paramItem.name}` : `请输入${paramItem.name}`)
			
			return [{
				placeholder,
				required: isRequired,
			}, {
				showRequireMark: isRequired,
			}]
		}

		/**
		 * 渲染动态参数字段
		 * 根据插件方法返回的params参数结构动态生成表单控件
		 * 支持的参数类型：string, boolean, select, textarea
		 * @param params 参数字段配置
		 * @param formConfig 表单配置工厂
		 * @param paramRef 参数引用
		 */
		const renderDynamicParamForm = (params: any[] = [], formConfig: any, paramRef: Ref<any>) => {
			if (!params || params.length === 0) {
				return []
			}

			return params.map((paramItem: ParamConfig) => {
				const fieldPath = `params.${paramItem.name}`
				
				// 初始化默认值
				initializeParamValue(paramRef, paramItem)

				switch (paramItem.type) {
					case 'string':
						return formConfig.input(
							paramItem.description || paramItem.name,
							fieldPath,
							...getFieldConfig(paramItem, 'input')
						)
					case 'boolean':
						return formConfig.switch(
							paramItem.description || paramItem.name,
							fieldPath,
							paramRef,
							{
								checkedText: '是',
								uncheckedText: '否',
								description: paramItem.description || '',
							}
						)
					case 'select':
						const options = paramItem.options?.map((opt: any) => ({
							label: typeof opt === 'string' ? opt : opt.label,
							value: typeof opt === 'string' ? opt : opt.value,
						})) || []
						return formConfig.select(
							paramItem.description || paramItem.name,
							fieldPath,
							options,
							...getFieldConfig(paramItem, 'select')
						)
					case 'textarea':
						const [fieldConfig, requireConfig] = getFieldConfig(paramItem, 'input')
						return formConfig.textarea(
							paramItem.description || paramItem.name,
							fieldPath,
							{
								...fieldConfig,
								rows: paramItem.rows || 3,
							},
							requireConfig
						)
					default:
						return formConfig.input(
							paramItem.description || paramItem.name,
							fieldPath,
							...getFieldConfig(paramItem, 'input')
						)
				}
			})
		}

		/**
		 * 加载插件方法
		 */
		const loadPluginActions = async (): Promise<void> => {
			if (!param.value.provider_id) return
			try {
				pluginActionOptionsLoading.value = true

				// 获取插件配置信息
				let pluginName = ''

				// 如果有 provider_data，从中获取插件名称
				if (param.value.provider_data?.data?.config) {
					const config = JSON.parse(param.value.provider_data.data.config || '{}')
					pluginName = config.name
				} else if (param.value.type) {
					// 编辑模式下，从 type 字段获取插件名称
					pluginName = param.value.type
				}

				if (pluginName) {
					const { data } = await getPlugins().fetch()
					const selectedPlugin = data?.find((plugin: { name: string }) => plugin.name === pluginName)
					const actions = selectedPlugin?.actions || []
					pluginActionOptions.value = actions.map((item: any) => ({
						label: `${item.description}`,
						value: item.name,
						params: item.params,
					}))

					// 如果当前已有选择的方法，设置对应的提示
					if (param.value.action) {
						const selectedAction = actions.find((action: any) => action.name === param.value.action)
						if (selectedAction) {
							pluginActionTips.value = renderPluginActionTips(selectedAction.params || {})
							currentDynamicParams.value = selectedAction.params || []
						}
					} else if (actions.length > 0) {
						// 如果没有选择方法，默认选择第一个
						const action = actions[0]
						param.value.action = action?.name
						pluginActionTips.value = renderPluginActionTips(action?.params || {})
						currentDynamicParams.value = action?.params || []
					}

					// 动态添加验证规则 - 参考 authApiManage 的实现方式
					if (configMode.value === 'default' && currentDynamicParams.value && currentDynamicParams.value.length > 0) {
						// 确保 rules.params 存在
						if (!verifyRules.params) {
							verifyRules.params = {}
						}
						
						// 为每个动态参数添加验证规则
						currentDynamicParams.value.forEach((paramItem: any) => {
							if (paramItem.required) {
								verifyRules.params[paramItem.name] = {
									required: true,
									message: `请输入${paramItem.description || paramItem.name}`,
									trigger: ['input', 'change']
								}
							}
						})
					}

					// // 只在创建模式下删除 provider_data
					// if (param.value.provider_data) {
					// 	delete param.value.provider_data
					// }
				}
			} catch (error) {
				handleError(error)
				pluginActionOptions.value = []
			} finally {
				pluginActionOptionsLoading.value = false
			}
		}

		/**
		 * 下一步
		 */
		const nextStep = async (): Promise<void> => {
			if (!param.value.provider) return message.error($t('t_0_1746858920894'))
			if (param.value.provider === 'localhost') {
				delete param.value.provider_id
			}
			// else {
			// param.value.provider_id = props.node.config.provider_id
			// }
			
			// 初始化配置模式和跳过开关为默认值
			configMode.value = 'default'
			param.value.configMode = 'default'
			if (isInitialized.value) {
				param.value.skip = 1
			}
			
			// 加载证书来源选项
			certOptions.value = findApplyUploadNodesUp(props.node.id).map((item) => {
				return { label: item.name, value: item.id }
			})

			if (!certOptions.value.length) {
				message.warning($t('t_3_1745748298161'))
			} else if (!param.value.inputs?.fromNodeId) {
				param.value.inputs = {
					name: certOptions.value[0]?.label || '',
					fromNodeId: certOptions.value[0]?.value || '',
				} as DeployNodeInputsConfig
			}

			current.value++
			next.value = false
		}

		// 表单组件
		const { component: Form, example } = useForm<DeployNodeConfig>({
			config: nodeFormConfig,
			defaultValue: param,
			rules: verifyRules,
		})

		/**
		 * 上一步
		 */
		const prevStep = (): void => {
			current.value--
			next.value = true
			param.value = {}
			param.value.provider_id = ''
			param.value.provider = ''
			isInitialized.value = true
		}

		/**
		 * 提交
		 */
		const submit = async (): Promise<void> => {
			try {
				if (param.value.provider === 'plugin' && configMode.value === 'custom' && typeof param.value.params === 'string') {
					param.value.params = param.value.params.replace(/[\r\n\s]+/g, '').replace(/'/g, '"')
				}
				// 表单验证
				if (configMode.value === 'default') {
					await example.value?.validate()
				} 
				const tempData = deepClone(param.value)

				// 处理siteName字段的提交转换：将数组合并为字符串
				if (
					MULTIPLE_SITE_PROVIDERS.includes(tempData.provider) &&
					tempData.siteName &&
					Array.isArray(tempData.siteName)
				) {
					tempData.siteName = tempData.siteName.join(',')
				}


				const inputs = tempData.inputs
				// 将输入值直接传递给updateNodeConfig
				updateNodeConfig(props.node.id, {
					...tempData,
				})
				// 单独更新inputs
				updateNode(props.node.id, { inputs: [inputs] } as any, false)
				isRefreshNode.value = props.node.id
				closeModal()
			} catch (error) {
				handleError(error)
			}
		}

		// 初始化
		onMounted(() => {
			// 如果已经选择了部署类型，则跳转到下一步
			if (param.value.provider) {
				if (props.node.inputs) param.value.inputs = props.node.inputs[0]
				if (SITE_SELECTOR_PROVIDERS.includes(param.value.provider)) {
					if (param.value.provider === 'btpanel-site') {
						param.value.siteName = param.value.siteName.split(',').filter(Boolean)
					}
					handleSiteSearch('')
				}
				// 如果是插件类型，加载插件方法
				if (param.value.provider === 'plugin') {
					loadPluginActions()
				}
				nextStep()
			}
		})

		return () => (
			<div class={styles.container} style={cssVar.value}>
				<NSteps size="small" current={current.value} status={currentStatus.value}>
					<NStep title={$t('t_28_1745735766626')} description={provider.value}></NStep>
					<NStep title={$t('t_29_1745735768933')} description={$t('t_2_1745738969878')}></NStep>
				</NSteps>
				{current.value === 1 && (
					<div class={styles.configContainer}>
						<div class={styles.leftPanel}>
							<NTabs
								type="bar"
								placement="left"
								value={currentTab.value}
								class="h-[45rem]"
								onUpdateValue={(val) => (currentTab.value = val)}
							>
								{deployTabOptions.map((tab) => (
									<NTabPane key={tab.name} name={tab.name} tab={tab.tab} />
								))}
							</NTabs>
						</div>
						<div class={styles.rightPanel}>
							<div class={styles.searchBar}>
								<NInput
									value={searchKeyword.value}
									onUpdateValue={(val) => (searchKeyword.value = val)}
									placeholder={$t('t_14_1747280811231')}
									clearable
								>
									{{
										suffix: () => (
											<div class="flex items-center">
												<SearchOutlined class="text-[var(--text-color-3)] w-[1.6rem] cursor-pointer font-bold" />
											</div>
										),
									}}
								</NInput>
							</div>
							<NDivider class="!my-[1rem]" />
							<div class={styles.cardContainer}>
								{filteredDeployTypes.value.map((item) => (
									<div
										key={item.value}
										class={`${styles.optionCard} ${param.value.provider === item.value ? styles.optionCardSelected : ''}`}
										onClick={() => {
											param.value.provider = item.value
										}}
									>
										<div class={styles.cardContent}>
											<SvgIcon
												icon={`resources-${item.icon?.replace(/-[a-z]+$/, '')}`}
												size="2rem"
												class={`${styles.icon} ${param.value.provider === item.value ? styles.iconSelected : ''}`}
											/>
											<NText type={param.value.provider === item.value ? 'primary' : 'default'} class="text-center">
												{item.label}
											</NText>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
				{current.value === 2 && (
					<NCard class={styles.formContainer}>
						<Form labelPlacement="top" />
					</NCard>
				)}
				<div class={styles.footer}>
					<NButton class={styles.footerButton} onClick={closeModal}>
						{$t('t_4_1744870861589')}
					</NButton>
					<NTooltip
						trigger="hover"
						disabled={!!param.value.provider}
						v-slots={{
							trigger: () => (
								<NButton
									type={next.value ? 'primary' : 'default'}
									class={`${styles.footerButton} ${next.value ? 'gradient-primary-btn' : 'gradient-default-btn'}`}
									disabled={!param.value.provider}
									onClick={next.value ? nextStep : prevStep}
								>
									{next.value ? $t('t_27_1745735764546') : $t('t_0_1745738961258')}
								</NButton>
							),
						}}
					>
						{next.value ? $t('t_4_1745765868807') : null}
					</NTooltip>
					{!next.value && (
						<NButton class="gradient-primary-btn" type="primary" onClick={submit}>
							{$t('t_1_1745738963744')}
						</NButton>
					)}
				</div>
			</div>
		)
	},
})