import { NFormItem, NInputNumber } from 'naive-ui'
import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { useStore } from '@components/flowChart/useStore'
import { $t } from '@locales/index'
import rules from './verify'
import DnsProviderSelect from '@components/dnsProviderSelect'
import type { ApplyNodeConfig } from '@components/flowChart/types'
import { deepClone } from '@baota/utils/data'

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
					provider_id: '',
					provider: '',
					end_day: 30,
					name_server: '',
					skip_check: 1,
				},
			}),
		},
	},
	setup(props) {
		const { updateNodeConfig, isRefreshNode } = useStore()
		// 弹窗辅助
		const { confirm } = useModalHooks()
		// 获取表单助手函数
		const { useFormInput, useFormHelp, useFormSwitch } = useFormHooks()
		// 表单参数
		const param = ref(deepClone(props.node.config))

		// 表单渲染配置
		const config = computed(() => {
			// 基本选项
			return [
				useFormInput($t('t_17_1745227838561'), 'domains', {
					placeholder: $t('t_0_1745735774005'),
					onInput: (val: string) => {
						param.value.domains = val.trim() // 去除空格
						param.value.domains = param.value.domains.replace(/，/g, ',') // 中文逗号分隔
						param.value.domains = param.value.domains.replace(/;/g, ',') // 去除分号
					},
					onFocus: () => {
						param.value.domains = param.value.domains.replace(/,^/g, '') // 中文逗号分隔
					},
				}),
				useFormInput($t('t_1_1745735764953'), 'email', {
					placeholder: $t('t_2_1745735773668'),
					onInput: (val: string) => (param.value.email = val.trim()),
				}),
				{
					type: 'custom' as const,
					render: () => {
						return (
							<DnsProviderSelect
								type="dns"
								path="provider_id"
								value={param.value.provider_id}
								onUpdate:value={(val: { value: string; type: string }) => {
									param.value.provider_id = val.value
									param.value.provider = val.type
								}}
							/>
						)
					},
				},
				{
					type: 'custom' as const,
					render: () => {
						return (
							<NFormItem label={$t('t_5_1745735769112')} path="end_day">
								<NInputNumber
									v-model:value={param.value.end_day}
									showButton={false}
									min={1}
									class="w-[180px]"
									placeholder={$t('t_6_1745735765205')}
								/>
								<span class="text-[1.4rem] ml-[1.2rem]">{$t('t_7_1745735768326')}</span>
							</NFormItem>
						)
					},
				},
				useFormInput(
					$t('t_0_1747106957037'),
					'name_server',
					{
						placeholder: $t('t_1_1747106961747'),
						onInput: (val: string) => {
							param.value.name_server = val.trim() // 去除空格
							param.value.name_server = param.value.name_server.replace(/，/g, ',') // 中文逗号分隔
							param.value.name_server = param.value.name_server.replace(/;/g, ',') // 去除分号
						},
						onFocus: () => {
							param.value.name_server = param.value.name_server.replace(/,^/g, '') // 中文逗号分隔
						},
					},
					{ showRequireMark: false },
				),
				useFormSwitch($t('t_2_1747106957037'), 'skip_check', {}, { showRequireMark: false }),
				useFormHelp([
					{
						content: $t('t_0_1747040228657'),
						isHtml: false,
					},
					{
						content: $t('t_1_1747040226143'),
						isHtml: false,
					},
				]),
			]
		})

		// 创建表单实例
		const { component: Form, data, example } = useForm<ApplyNodeConfig>({ defaultValue: param, config, rules })

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
