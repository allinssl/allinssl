import { useBaseNodeValidator } from '@workflowView/lib/BaseNodeValidator'
import { $t } from '@locales/index'
import TypeIcon from '@components/TypeIcon'
import rules from './verify'
import type { DeployNodeConfig, DeployNodeInputsConfig } from '@components/FlowChart/types'
import { useNodeHandler } from '@workflowView/lib/NodeHandler'
import Drawer from './model'
import { Ref } from 'vue'

interface NodeProps {
	node: {
		id: string
		inputs: DeployNodeInputsConfig
		config: DeployNodeConfig
	}
}

export default defineComponent({
	name: 'DeployNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; inputs: DeployNodeInputsConfig; config: DeployNodeConfig }>,
			default: () => ({ id: '', inputs: {}, config: {} }),
		},
	},
	setup(props: NodeProps, { expose }) {
		// 使用通用节点验证
		const renderContent = (valid: boolean, config: DeployNodeConfig) => {
			if (config.provider) {
				return <TypeIcon icon={config.provider} type={valid ? 'success' : 'warning'} />
			}
			return $t('t_9_1745735765287')
		}
		const { renderNode } = useBaseNodeValidator(props, rules, renderContent)

		// 使用通用节点处理器
		const { handleNodeClick } = useNodeHandler<DeployNodeConfig>()

		/**
		 * @description 点击节点
		 * @param {Ref<{ id: string; name: string; config: DeployNodeConfig }>} selectedNode 选中的节点
		 */
		const handleNodeClicked = (selectedNode: Ref<{ id: string; name: string; config: DeployNodeConfig }>) => {
			handleNodeClick(selectedNode, (node) => <Drawer node={node} />, false, '68rem', false)
		}

		// 暴露方法给父组件
		expose({
			handleNodeClick: handleNodeClicked,
		})

		return renderNode
	},
})
