import {
	NButton,
	NCard,
	NStep,
	NSteps,
	NText,
	NTooltip,
	NTabs,
	NTabPane,
	NInput,
	NDivider,
	NFormItem,
	NSwitch,
} from 'naive-ui'
import { useForm, useFormHooks, useModalClose, useModalOptions, useMessage } from '@baota/naive-ui/hooks'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { useError } from '@baota/hooks/error'
import { useStore } from '@components/flowChart/useStore'
import { DeployNodeConfig, DeployNodeInputsConfig } from '@components/flowChart/types'
import { $t } from '@locales/index'
import SvgIcon from '@components/svgIcon'
import DnsProviderSelect from '@/components/dnsProviderSelect'
import SearchOutlined from '@vicons/antd/es/SearchOutlined'

import styles from './index.module.css'
import verifyRules from './verify'
import { deepClone } from '@baota/utils/data'

type StepStatus = 'process' | 'wait' | 'finish' | 'error'

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
		// 获取表单助手函数
		const { useFormInput, useFormTextarea, useFormSelect } = useFormHooks()
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

		// 部署类型选项
		const deployTypeOptions = [
			{ label: $t('t_6_1747271296994'), value: 'localhost', category: 'host', icon: 'ssh' },
			{ label: $t('t_5_1744958839222'), value: 'ssh', category: 'host', icon: 'ssh' },
			{ label: $t('t_10_1745735765165'), value: 'btpanel', category: 'btpanel', icon: 'btpanel' },
			{ label: $t('t_11_1745735766456'), value: 'btpanel-site', category: 'btpanel', icon: 'btpanel' },
			{ label: $t('t_0_1747215751189'), value: 'btwaf-site', category: 'btpanel', icon: 'btpanel' },
			{ label: $t('t_12_1745735765571'), value: '1panel', category: '1panel', icon: '1panel' },
			{ label: $t('t_13_1745735766084'), value: '1panel-site', category: '1panel', icon: '1panel' },
			{ label: $t('t_14_1745735766121'), value: 'tencentcloud-cdn', category: 'tencentcloud', icon: 'tencentcloud' },
			{ label: $t('t_15_1745735768976'), value: 'tencentcloud-cos', category: 'tencentcloud', icon: 'tencentcloud' },
			{ label: $t('t_16_1745735766712'), value: 'aliyun-cdn', category: 'aliyun', icon: 'aliyun' },
			{ label: $t('t_2_1746697487164'), value: 'aliyun-oss', category: 'aliyun', icon: 'aliyun' },
			{ label: $t('t_0_1747298114839'), value: 'safeline-site', category: 'safeline', icon: 'safeline' },
			{ label: $t('t_1_1747298114192'), value: 'safeline-panel', category: 'safeline', icon: 'safeline' },
		]
		const certOptions = ref<{ label: string; value: string }[]>([]) // 证书选项
		const current = ref(1) // 当前步骤
		const next = ref(true) // 是否是下一步
		const currentStatus = ref<StepStatus>('process') // 当前步骤状态
		const currentTab = ref('all') // 当前选中的tab
		const searchKeyword = ref('') // 搜索关键字

		const param = ref(deepClone(props.node.config)) // 表单参数
		const localProvider = ref([{ label: $t('t_6_1747271296994'), value: 'localhost' }]) // 本地提供商
		const provider = computed(() => {
			return param.value.provider
				? $t('t_4_1746858917773') + '：' + deployTypeOptions.find((item) => item.value === param.value.provider)?.label
				: $t('t_19_1745735766810')
		})

		// 过滤后的部署类型选项
		const filteredDeployTypes = computed(() => {
			let filtered = deployTypeOptions

			// 根据标签过滤
			if (currentTab.value !== 'all') {
				filtered = filtered.filter((item) => item.category === currentTab.value)
			}

			// 根据搜索关键词过滤
			if (searchKeyword.value) {
				const keyword = searchKeyword.value.toLowerCase()
				filtered = filtered.filter(
					(item) => item.label.toLowerCase().includes(keyword) || item.value.toLowerCase().includes(keyword),
				)
			}

			return filtered
		})

		// 表单配置
		const formConfig = computed(() => {
			const config = []
			config.push(
				...[
					param.value.provider !== 'localhost'
						? {
								type: 'custom' as const,
								render: () => {
									return (
										<DnsProviderSelect
											type={param.value.provider}
											path="provider_id"
											value={param.value.provider_id}
											onUpdate:value={(val: { value: number; type: string }) => {
												param.value.provider_id = val.value
											}}
										/>
									)
								},
							}
						: useFormSelect($t('t_0_1746754500246'), 'provider', localProvider.value, { disabled: true }),
				],
				useFormSelect($t('t_1_1745748290291'), 'inputs.fromNodeId', certOptions.value, {
					onUpdateValue: (val, option: { label: string; value: string }) => {
						param.value.inputs.fromNodeId = val
						param.value.inputs.name = option?.label
					},
				}),
			)
			switch (param.value.provider) {
				case 'localhost':
				case 'ssh':
					config.push(
						...[
							useFormInput($t('t_1_1747280813656'), 'certPath', {
								placeholder: $t('t_30_1746667591892'),
								onInput: (val: string) => (param.value.certPath = val.trim()),
							}),
							useFormInput($t('t_2_1747280811593'), 'keyPath', {
								placeholder: $t('t_31_1746667593074'),
								onInput: (val: string) => (param.value.keyPath = val.trim()),
							}),
							useFormTextarea(
								$t('t_3_1747280812067'),
								'beforeCmd',
								{ placeholder: $t('t_21_1745735769154'), rows: 2 },
								{ showRequireMark: false },
							),
							useFormTextarea(
								$t('t_4_1747280811462'),
								'afterCmd',
								{ placeholder: $t('t_22_1745735767366'), rows: 2 },
								{ showRequireMark: false },
							),
						],
					)
					break
				case 'btwaf-site':
				case 'btpanel-site':
				case 'safeline-site':
					config.push(
						...[
							useFormInput($t('t_0_1747296173751'), 'siteName', {
								placeholder: $t('t_1_1747296175494'),
								onInput: (val: string) => (param.value.siteName = val.trim()),
							}),
						],
					)
					break
				case '1panel-site':
					config.push(
						...[
							useFormInput($t('t_6_1747280809615'), 'site_id', {
								placeholder: $t('t_24_1745735766826'),
								onInput: (val: string) => (param.value.site_id = val.trim()),
							}),
						],
					)
					break
				case 'tencentcloud-cdn':
				case 'aliyun-cdn':
					config.push(
						...[
							useFormInput($t('t_17_1745227838561'), 'domain', {
								placeholder: $t('t_0_1744958839535'),
								onInput: (val: string) => (param.value.domain = val.trim()),
							}),
						],
					)
					break
				case 'tencentcloud-cos':
				case 'aliyun-oss':
					config.push(
						...[
							useFormInput($t('t_17_1745227838561'), 'domain', {
								placeholder: $t('t_0_1744958839535'),
								onInput: (val: string) => (param.value.domain = val.trim()),
							}),
						],
					)
					config.push(
						...[
							useFormInput($t('t_7_1747280808936'), 'region', {
								placeholder: $t('t_25_1745735766651'),
								onInput: (val: string) => (param.value.region = val.trim()),
							}),
						],
					)
					config.push(
						...[
							useFormInput($t('t_8_1747280809382'), 'bucket', {
								placeholder: $t('t_26_1745735767144'),
								onInput: (val: string) => (param.value.bucket = val.trim()),
							}),
						],
					)
					break
			}

			config.push({
				type: 'custom' as const,
				render: () => {
					return (
						<NFormItem label={$t('t_9_1747280810169')} path="skip">
							<NText>{$t('t_10_1747280816952')}</NText>
							<NSwitch
								v-model:value={param.value.skip}
								checkedValue={1}
								uncheckedValue={0}
								class="mx-[.5rem] "
								v-slots={{ checked: () => $t('t_11_1747280809178'), unchecked: () => $t('t_12_1747280809893') }}
							/>
							<NText>{$t('t_13_1747280810369')}</NText>
						</NFormItem>
					)
				},
			})
			return config
		})

		/**
		 * @description 下一步
		 * @returns
		 */
		const nextStep = async () => {
			if (!param.value.provider) return message.error($t('t_0_1746858920894'))
			if (param.value.provider === 'localhost') {
				delete param.value.provider_id
			} else {
				param.value.provider_id = props.node.config.provider_id
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

		/**
		 * @description 上一步
		 * @returns
		 */
		const prevStep = () => {
			current.value--
			next.value = true
			param.value.provider_id = ''
			param.value.provider = ''
		}

		// 表单组件
		const { component: Form, example } = useForm<DeployNodeConfig>({
			config: formConfig,
			defaultValue: param,
			rules: verifyRules,
		})

		/**
		 * @description 提交
		 * @returns
		 */
		const submit = async () => {
			try {
				await example.value?.validate()
				const tempData = param.value
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
			// 隐藏底部按钮
			modalOptions.value.footer = false
			// 设置弹窗宽度和高度
			modalOptions.value.area = [850, 600]
			// 如果已经选择了部署类型，则跳转到下一步
			if (param.value.provider) {
				if (props.node.inputs) param.value.inputs = props.node.inputs[0]
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
								onUpdateValue={(val) => (currentTab.value = val)}
							>
								<NTabPane name="all" tab={$t('t_7_1747271292060')} />
								<NTabPane name="host" tab={$t('t_1_1745833931535')} />
								<NTabPane name="btpanel" tab={$t('t_8_1747271290414')} />
								<NTabPane name="1panel" tab={$t('t_9_1747271284765')} />
								<NTabPane name="tencentcloud" tab={$t('t_3_1747019616129')} />
								<NTabPane name="aliyun" tab={$t('t_2_1747019616224')} />
								<NTabPane name="safeline" tab={$t('t_1_1747298114192')} />
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
												icon={`resources-${item.icon.replace(/-[a-z]+$/, '')}`}
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
