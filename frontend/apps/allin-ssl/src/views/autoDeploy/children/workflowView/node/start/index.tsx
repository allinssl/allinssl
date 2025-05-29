import { $t } from '@locales/index'
import rules from './verify'
import type { StartNodeConfig } from '@components/FlowChart/types'
import { useNodeHandler } from '@workflowView/lib/NodeHandler'
import Drawer from './model'
import { Ref } from 'vue'
import { useBaseNodeValidator } from '@workflowView/lib/BaseNodeValidator'

interface NodeProps {
	node: {
		id: string
		config: StartNodeConfig
	}
}

export default defineComponent({
	name: 'StartNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: StartNodeConfig }>,
			default: () => ({ id: '', config: {} }),
		},
	},
	setup(props: NodeProps, { expose }) {
		// 使用通用节点验证
		const renderContent = (valid: boolean, config: StartNodeConfig) => {
			if (valid) {
				return config.exec_type === 'auto' ? $t('t_4_1744875940750') : $t('t_5_1744875940010')
			}
			return '未配置'
		}

		const { renderNode } = useBaseNodeValidator(props, rules, renderContent)

		// 使用通用节点处理器
		const { handleNodeClick } = useNodeHandler<StartNodeConfig>()

		/**
		 * @description 点击节点
		 * @param {Ref<{ id: string; name: string; config: StartNodeConfig }>} selectedNode 选中的节点
		 */
		const handleNodeClicked = (selectedNode: Ref<{ id: string; name: string; config: StartNodeConfig }>) => {
			handleNodeClick(selectedNode, (node) => <Drawer node={node} />)
		}

		// 暴露方法给父组件
		expose({
			handleNodeClick: handleNodeClicked,
		})

		return renderNode
	},
})
