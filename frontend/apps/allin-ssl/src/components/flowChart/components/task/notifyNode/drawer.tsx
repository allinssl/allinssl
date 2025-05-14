import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { FormConfig } from '@baota/naive-ui/types/form'
import { useStore } from '@components/flowChart/useStore'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
// 假设这个类型需要在types文件中定义

import NotifyProviderSelect from '@components/notifyProviderSelect'
import verify from './verify'

import { NotifyNodeConfig } from '@components/flowChart/types'
import { deepClone } from '@baota/utils/data'

export default defineComponent({
	name: 'NotifyNodeDrawer',
	props: {
		// 节点配置数据
		node: {
			type: Object as PropType<{ id: string; config: NotifyNodeConfig }>,
			default: () => ({
				id: '',
				config: {
					provider: '',
					provider_id: '',
					subject: '',
					body: '',
				},
			}),
		},
	},
	setup(props) {
		const { updateNodeConfig, isRefreshNode } = useStore()
		const { useFormInput, useFormTextarea, useFormCustom } = useFormHooks()
		const { confirm } = useModalHooks()
		const { handleError } = useError()
		const param = ref(deepClone(props.node.config))

		// 表单渲染配置
		const formConfig: FormConfig = [
			useFormInput($t('t_0_1745920566646'), 'subject', {
				placeholder: $t('t_3_1745887835089'),
				onInput: (val: string) => (param.value.subject = val.trim()),
			}),
			useFormTextarea($t('t_1_1745920567200'), 'body', {
				placeholder: $t('t_4_1745887835265'),
				rows: 4,
				onInput: (val: string) => (param.value.body = val.trim()),
			}),
			useFormCustom(() => (
				<NotifyProviderSelect
					path="provider_id"
					value={param.value.provider_id}
					isAddMode={true}
					onUpdate:value={(item) => {
						param.value.provider_id = item.value
						param.value.provider = item.type
					}}
				/>
			)),
		]

		// 创建表单实例
		const {
			component: Form,
			data,
			example,
		} = useForm<NotifyNodeConfig>({
			defaultValue: param,
			config: formConfig,
			rules: verify,
		})

		// 确认事件触发
		confirm(async (close) => {
			try {
				await example.value?.validate()
				updateNodeConfig(props.node.id, data.value)
				isRefreshNode.value = props.node.id
				close()
			} catch (error) {
				handleError(error)
			}
		})

		return () => (
			<div class="notify-node-drawer">
				<Form labelPlacement="top" />
			</div>
		)
	},
})
