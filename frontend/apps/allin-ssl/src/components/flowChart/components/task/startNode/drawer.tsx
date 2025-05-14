import { NFormItemGi, NGrid, NInputGroup, NInputGroupLabel, NInputNumber, NSelect } from 'naive-ui'
import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { $t } from '@locales/index'
import { useStore } from '@components/flowChart/useStore'
import rules from './verify'

import type { StartNodeConfig } from '@components/flowChart/types'
import type { FormConfig } from '@baota/naive-ui/types/form'

// 类型
import type { VNode } from 'vue'
import { useError } from '@baota/hooks/error'
import { deepClone } from '@baota/utils/data'

export default defineComponent({
	name: 'StartNodeDrawer',
	props: {
		// 节点配置数据
		node: {
			type: Object as PropType<{ id: string; config: StartNodeConfig }>,
			default: () => ({
				id: '',
				config: {
					exec_type: 'auto',
				},
			}),
		},
	},
	setup(props) {
		const { updateNodeConfig, isRefreshNode } = useStore()
		// 弹窗辅助
		const { confirm } = useModalHooks()
		// 错误处理
		const { handleError } = useError()
		// 获取表单助手函数
		const { useFormRadio, useFormCustom } = useFormHooks()
		// 表单参数
		const param = ref(deepClone(props.node.config))

		// 周期类型选项
		const cycleTypeOptions = [
			{ label: $t('t_2_1744875938555'), value: 'day' },
			{ label: $t('t_0_1744942117992'), value: 'week' },
			{ label: $t('t_3_1744875938310'), value: 'month' },
		]

		// 星期选项
		const weekOptions = [
			{ label: $t('t_1_1744942116527'), value: 1 },
			{ label: $t('t_2_1744942117890'), value: 2 },
			{ label: $t('t_3_1744942117885'), value: 3 },
			{ label: $t('t_4_1744942117738'), value: 4 },
			{ label: $t('t_5_1744942117167'), value: 5 },
			{ label: $t('t_6_1744942117815'), value: 6 },
			{ label: $t('t_7_1744942117862'), value: 0 },
		]

		// 定义默认值常量，避免重复
		const DEFAULT_AUTO_SETTINGS: Record<string, StartNodeConfig> = {
			day: { exec_type: 'auto', type: 'day', hour: 1, minute: 0 },
			week: { exec_type: 'auto', type: 'week', hour: 1, minute: 0, week: 1 },
			month: { exec_type: 'auto', type: 'month', hour: 1, minute: 0, month: 1 },
		}

		// 创建时间输入input
		const createTimeInput = (value: number, updateFn: (val: number) => void, max: number, label: string): VNode => (
			<NInputGroup>
				<NInputNumber
					value={value}
					onUpdateValue={(val: number | null) => {
						if (val !== null) {
							updateFn(val)
						}
					}}
					max={max}
					min={0}
					showButton={false}
					class="w-full"
				/>
				<NInputGroupLabel>{label}</NInputGroupLabel>
			</NInputGroup>
		)

		// 表单渲染
		const formRender = computed(() => {
			const formItems: FormConfig = []
			if (param.value.exec_type === 'auto') {
				formItems.push(
					useFormCustom<StartNodeConfig>(() => {
						return (
							<NGrid cols={24} xGap={24}>
								<NFormItemGi label={$t('t_2_1744879616413')} span={8} showRequireMark path="type">
									<NSelect class="w-full" options={cycleTypeOptions} v-model:value={param.value.type} />
								</NFormItemGi>

								{param.value.type !== 'day' && (
									<NFormItemGi span={5} path={param.value.type === 'week' ? 'week' : 'month'}>
										{param.value.type === 'week' ? (
											<NSelect
												value={param.value.week}
												onUpdateValue={(val: number) => {
													if (typeof val === 'number') {
														param.value.week = val
													}
												}}
												options={weekOptions}
											/>
										) : (
											createTimeInput(
												param.value.month || 0,
												(val: number) => (param.value.month = val),
												31,
												$t('t_29_1744958838904'),
											)
										)}
									</NFormItemGi>
								)}

								<NFormItemGi span={param.value.type === 'day' ? 7 : 5} path="hour">
									{createTimeInput(
										param.value.hour || 0,
										(val: number) => (param.value.hour = val),
										23,
										$t('t_5_1744879615277'),
									)}
								</NFormItemGi>

								<NFormItemGi span={param.value.type === 'day' ? 7 : 5} path="minute">
									{createTimeInput(
										param.value.minute || 0,
										(val: number) => (param.value.minute = val),
										59,
										$t('t_3_1744879615723'),
									)}
								</NFormItemGi>
							</NGrid>
						)
					}),
				)
			}
			return [
				// 运行模式选择
				useFormRadio($t('t_30_1745735764748'), 'exec_type', [
					{ label: $t('t_4_1744875940750'), value: 'auto' },
					{ label: $t('t_5_1744875940010'), value: 'manual' },
				]),
				...formItems,
			]
		})

		// 创建表单实例
		const {
			component: Form,
			data,
			example,
		} = useForm<StartNodeConfig>({
			defaultValue: param,
			config: formRender,
			rules,
		})

		// 更新参数的函数
		const updateParamValue = (updates: StartNodeConfig) => {
			param.value = { ...updates }
		}

		// 监听执行类型变化
		watch(
			() => param.value.exec_type,
			(newVal) => {
				if (newVal === 'auto') {
					updateParamValue(DEFAULT_AUTO_SETTINGS.day as StartNodeConfig)
				} else if (newVal === 'manual') {
					updateParamValue({ exec_type: 'manual' })
				}
			},
		)

		// 监听类型变化
		watch(
			() => param.value.type,
			(newVal) => {
				if (newVal && param.value.exec_type === 'auto') {
					updateParamValue(DEFAULT_AUTO_SETTINGS[newVal] as StartNodeConfig)
				}
			},
		)

		// 确认事件触发
		confirm(async (close) => {
			try {
				await example.value?.validate()
				updateNodeConfig(props.node.id, data.value) // 更新节点配置
				isRefreshNode.value = props.node.id // 刷新节点
				close()
			} catch (error) {
				handleError(error)
			}
		})

		return () => (
			<div class="apply-node-drawer">
				<Form labelPlacement="top" />
			</div>
		)
	},
})
