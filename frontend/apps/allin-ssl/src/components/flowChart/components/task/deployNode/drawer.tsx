import { NButton, NCard, NStep, NSteps, NText, NTooltip } from 'naive-ui'
import { useForm, useFormHooks, useModalClose, useModalOptions, useMessage } from '@baota/naive-ui/hooks'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { useError } from '@baota/hooks/error'
import { useStore } from '@components/flowChart/useStore'
import { DeployNodeConfig, DeployNodeInputsConfig } from '@components/flowChart/types'
import { $t } from '@locales/index'
import SvgIcon from '@components/svgIcon'
import DnsProviderSelect from '@/components/dnsProviderSelect'

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
			{ label: $t('t_5_1744958839222'), value: 'ssh' },
			{ label: $t('t_10_1745735765165'), value: 'btpanel' },
			{ label: $t('t_11_1745735766456'), value: 'btpanel-site' },
			{ label: $t('t_12_1745735765571'), value: '1panel' },
			{ label: $t('t_13_1745735766084'), value: '1panel-site' },
			{ label: $t('t_14_1745735766121'), value: 'tencentcloud-cdn' },
			{ label: $t('t_15_1745735768976'), value: 'tencentcloud-cos' },
			{ label: $t('t_16_1745735766712'), value: 'aliyun-cdn' },
			{ label: $t('t_2_1746697487164'), value: 'aliyun-oss' },
		]
		const certOptions = ref<{ label: string; value: string }[]>([]) // 证书选项
		const current = ref(1) // 当前步骤
		const next = ref(true) // 是否是下一步
		const currentStatus = ref<StepStatus>('process') // 当前步骤状态

		const param = ref(deepClone(props.node.config)) // 表单参数
		const provider = computed(() => {
			return param.value.provider
				? $t('t_4_1746858917773') + '：' + deployTypeOptions.find((item) => item.value === param.value.provider)?.label
				: $t('t_19_1745735766810')
		})
		// 表单配置
		const formConfig = computed(() => {
			const config = []
			config.push(
				...[
					{
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
					},
				],
				useFormSelect($t('t_1_1745748290291'), 'inputs.fromNodeId', certOptions.value, {
					onUpdateValue: (val, option: { label: string; value: string }) => {
						param.value.inputs.fromNodeId = val
						param.value.inputs.name = option?.label
					},
				}),
			)
			switch (param.value.provider) {
				case 'ssh':
					config.push(
						...[
							useFormInput('证书文件路径（仅支持PEM格式）', 'certPath', {
								placeholder: $t('t_30_1746667591892'),
								onInput: (val: string) => (param.value.certPath = val.trim()),
							}),
							useFormInput('私钥文件路径', 'keyPath', {
								placeholder: $t('t_31_1746667593074'),
								onInput: (val: string) => (param.value.keyPath = val.trim()),
							}),
							useFormTextarea(
								'前置命令',
								'beforeCmd',
								{ placeholder: $t('t_21_1745735769154') },
								{ showRequireMark: false },
							),
							useFormTextarea(
								'后置命令',
								'afterCmd',
								{ placeholder: $t('t_22_1745735767366') },
								{ showRequireMark: false },
							),
						],
					)
					break
				case 'btpanel-site':
					config.push(
						...[
							useFormInput('站点名称', 'siteName', {
								placeholder: $t('t_23_1745735766455'),
								onInput: (val: string) => (param.value.siteName = val.trim()),
							}),
						],
					)
					break
				case '1panel-site':
					config.push(
						...[
							useFormInput('站点ID', 'site_id', {
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
							useFormInput('域名', 'domain', {
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
							useFormInput('域名', 'domain', {
								placeholder: $t('t_0_1744958839535'),
								onInput: (val: string) => (param.value.domain = val.trim()),
							}),
						],
					)
					config.push(
						...[
							useFormInput('区域', 'region', {
								placeholder: $t('t_25_1745735766651'),
								onInput: (val: string) => (param.value.region = val.trim()),
							}),
						],
					)
					config.push(
						...[
							useFormInput('存储桶', 'bucket', {
								placeholder: $t('t_26_1745735767144'),
								onInput: (val: string) => (param.value.bucket = val.trim()),
							}),
						],
					)
					break
			}
			return config
		})

		/**
		 * @description 下一步
		 * @returns
		 */
		const nextStep = async () => {
			if (!param.value.provider) return message.error($t('t_0_1746858920894'))

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
				updateNode(props.node.id, { inputs: [inputs], config: {} }, false)
				delete tempData.inputs
				updateNodeConfig(props.node.id, {
					...tempData,
				})
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
					<div class={styles.cardContainer}>
						{deployTypeOptions.map((item) => (
							<div
								key={item.value}
								class={`${styles.optionCard} ${param.value.provider === item.value ? styles.optionCardSelected : ''}`}
								onClick={() => {
									param.value.provider = item.value
								}}
							>
								<NCard contentClass={styles.cardContent} hoverable bordered={false}>
									<SvgIcon
										icon={`resources-${item.value.replace(/-[a-z]+$/, '')}`}
										size="2rem"
										class={`${styles.icon} ${param.value.provider === item.value ? styles.iconSelected : ''}`}
									/>
									<NText type={param.value.provider === item.value ? 'primary' : 'default'}>{item.label}</NText>
								</NCard>
							</div>
						))}
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
