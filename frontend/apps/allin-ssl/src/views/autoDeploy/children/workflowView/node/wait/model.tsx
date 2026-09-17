import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { FormConfig } from '@baota/naive-ui/types/form'
import { useStore } from '@components/FlowChart/useStore'
import { useError } from '@baota/hooks/error'
import { deepClone } from '@baota/utils/data'
import verifyRules from './verify'

interface WaitNodeConfig {
	seconds?: number
}

export default defineComponent({
	name: 'WaitNodeDrawer',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: WaitNodeConfig }>,
			default: () => ({
				id: '',
				config: {
					seconds: undefined,
				},
			}),
		},
	},
	setup(props) {
		const { updateNodeConfig, isRefreshNode } = useStore()
		const { useFormInputNumber, useFormHelp } = useFormHooks()
		const { confirm } = useModalHooks()
		const { handleError } = useError()
		const param = ref(deepClone(props.node.config))

		const formConfig: FormConfig = [
			useFormInputNumber('等待秒数', 'seconds', {
				class: 'w-full',
				min: 1,
				precision: 0,
				placeholder: '请输入等待秒数',
			}),
			useFormHelp([{ content: '执行到该节点后暂停指定秒数，再继续执行后续节点。' }]),
		]

		const {
			component: Form,
			data,
			example,
		} = useForm<WaitNodeConfig>({
			defaultValue: param,
			config: formConfig,
			rules: verifyRules,
		})

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
			<div class="wait-node-drawer">
				<Form labelPlacement="top" />
			</div>
		)
	},
})
