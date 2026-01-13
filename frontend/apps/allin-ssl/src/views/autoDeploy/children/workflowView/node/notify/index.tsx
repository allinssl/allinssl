import { NotifyNodeConfig } from '@components/FlowChart/types'
import { useNodeHandler } from '@workflowView/lib/NodeHandler'
import Drawer from './model'
import { Ref } from 'vue'

import rules from './verify'
import TypeIcon from '@components/TypeIcon'
import { $t } from '@locales/index'
import { useBaseNodeValidator } from '@workflowView/lib/BaseNodeValidator'

export default defineComponent({
	name: 'NotifyNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: NotifyNodeConfig }>,
			default: () => ({ id: '', config: {} }),
		},
	},
	setup(props, { expose }) {
		// 使用通用节点验证
		const renderContent = (valid: boolean, config: NotifyNodeConfig) => {
			if (config.provider) {
				console.log(config.provider)
				return <TypeIcon icon={config.provider} type={valid ? 'success' : 'warning'} />
			}
			return $t('t_9_1745735765287')
		}

		const { renderNode } = useBaseNodeValidator(props, rules, renderContent)

		// 使用通用节点处理器
		const { handleNodeClick } = useNodeHandler<NotifyNodeConfig>()

		/**
		 * @description 点击节点
		 * @param {Ref<{ id: string; name: string; config: NotifyNodeConfig }>} selectedNode 选中的节点
		 */
		const handleNodeClicked = (selectedNode: Ref<{ id: string; name: string; config: NotifyNodeConfig }>) => {
			handleNodeClick(selectedNode, (node) => <Drawer node={node} />)
		}

		// 暴露方法给父组件
		expose({ handleNodeClick: handleNodeClicked })
		return renderNode
	},
})
