import { useBaseNodeValidator } from '@workflowView/lib/BaseNodeValidator'
import { useNodeHandler } from '@workflowView/lib/NodeHandler'
import Drawer from './model'
import rules from './verify'
import { Ref } from 'vue'

interface WaitNodeConfig {
	seconds?: number
}

export default defineComponent({
	name: 'WaitNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: WaitNodeConfig }>,
			default: () => ({ id: '', config: {} }),
		},
	},
	setup(props, { expose }) {
		const renderContent = (valid: boolean, config: WaitNodeConfig) => {
			if (valid && config.seconds !== undefined) {
				return `等待 ${config.seconds} 秒`
			}
			return '待配置等待时长'
		}

		const { renderNode } = useBaseNodeValidator(props, rules, renderContent)
		const { handleNodeClick } = useNodeHandler<WaitNodeConfig>()

		const handleNodeClicked = (selectedNode: Ref<{ id: string; name: string; config: WaitNodeConfig }>) => {
			handleNodeClick(selectedNode, (node) => <Drawer node={node} />)
		}

		expose({ handleNodeClick: handleNodeClicked })

		return renderNode
	},
})
