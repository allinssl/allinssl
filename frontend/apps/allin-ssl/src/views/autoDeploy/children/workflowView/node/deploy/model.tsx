import { NButton, NCard, NStep, NSteps, NText, NTooltip, NTabs, NTabPane, NInput, NDivider } from 'naive-ui'
import { useForm, useModalClose, useModalOptions, useMessage } from '@baota/naive-ui/hooks'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { useError } from '@baota/hooks/error'
import { useStore } from '@components/FlowChart/useStore'
import { getSites } from '@api/access'

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

import SvgIcon from '@components/SvgIcon'
import DnsProviderSelect from '@components/DnsProviderSelect'
import SearchOutlined from '@vicons/antd/es/SearchOutlined'

import type { DeployNodeConfig, DeployNodeInputsConfig } from '@components/FlowChart/types'
import type { DnsProviderType } from '@components/DnsProviderSelect/types'
import type { VNode } from 'vue'

import styles from './index.module.css'

type StepStatus = 'process' | 'wait' | 'finish' | 'error'

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

		// 表单参数
		const param = ref(deepClone(props.node.config))
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
							'onUpdate:value': (val: { value: number | string; type: string }) => {
								if (
									val.value !== '' &&
									param.value.provider_id !== '' &&
									param.value.provider_id !== val.value &&
									param.provider === 'btpanel-site'
								) {
									param.value.siteName = []
								}
								param.value.provider_id = val.value
								param.value.type = val.type
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

			console.log(param.value.provider)
			// 根据不同的部署类型添加不同的表单配置
			switch (param.value.provider) {
				case 'localhost':
				case 'ssh':
					config.push(...formConfig.sshDeploy())
					break
				case 'btpanel-site':
					// 使用异步加载的网站选择器
					config.push(
						formConfig.select($t('t_0_1747296173751'), 'siteName', siteOptions.value, {
							placeholder: $t('t_10_1747990232207'),
							multiple: true,
							filterable: true,
							remote: true,
							clearable: true,
							loading: siteOptionsLoading.value,
							onSearch: handleSiteSearch,
						}),
					)
					break
				case 'btwaf-site':
				case 'btpanel-dockersite':
				case 'safeline-site':
					config.push(...formConfig.siteDeploy())
					break
				case '1panel-site':
					config.push(...formConfig.onePanelSiteDeploy())
					break
				case 'tencentcloud-cdn':
				case 'tencentcloud-waf':
				case 'tencentcloud-teo':
				case 'aliyun-cdn':
				case 'baidu-cdn':
				case 'qiniu-cdn':
				case 'qiniu-oss':
				case 'huaweicloud-cdn':
					config.push(...formConfig.cdnDeploy())
					break
				case 'aliyun-waf':
					config.push(...formConfig.wafDeploy())
					break
				case 'tencentcloud-cos':
				case 'aliyun-oss':
					config.push(...formConfig.storageDeploy())
					break
			}

			// 添加跳过选项
			config.push(formConfig.skipOption(param))
			return config
		})

		watch(
			() => param.value.provider_id,
			() => {
				if (param.value.provider === 'btpanel-site') {
					handleSiteSearch('')
				}
			},
		)

		/**
		 * 处理网站搜索
		 * @param query 搜索关键字
		 */
		const handleSiteSearch = useThrottleFn(async (query: string): Promise<void> => {
			if (param.value.provider !== 'btpanel-site') return
			if (!param.value.provider_id) return
			try {
				siteOptionsLoading.value = true
				const { data } = await getSites({
					id: param.value.provider_id.toString(),
					type: param.value.provider,
					search: query,
					limit: '100',
				}).fetch()
				siteOptions.value = data?.map((siteName: string) => ({
					label: siteName,
					value: siteName,
				}))
				// param.value.siteName = []
			} catch (error) {
				handleError(error)
				siteOptions.value = []
			} finally {
				siteOptionsLoading.value = false
			}
		}, 1000)

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
		}

		/**
		 * 提交
		 */
		const submit = async (): Promise<void> => {
			try {
				await example.value?.validate()
				const tempData = deepClone(param.value)

				// 处理siteName字段的提交转换：将数组合并为字符串
				if (tempData.provider === 'btpanel-site' && tempData.siteName && Array.isArray(tempData.siteName)) {
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
				// 处理siteName字段的读取转换：将字符串拆分为数组（针对已有数据）
				if (param.value.provider === 'btpanel-site' && param.value.siteName) {
					handleSiteSearch('')
					param.value.siteName = param.value.siteName.split(',').filter(Boolean)
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
											<NText type={param.value.provider === item.value ? 'primary' : 'default'}>{item.label}</NText>
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
									class={styles.footerButton}
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
						<NButton type="primary" onClick={submit}>
							{$t('t_1_1745738963744')}
						</NButton>
					)}
				</div>
			</div>
		)
	},
})
