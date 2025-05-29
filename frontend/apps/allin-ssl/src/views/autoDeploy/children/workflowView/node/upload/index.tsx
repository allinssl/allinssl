import { useBaseNodeValidator } from '@workflowView/lib/BaseNodeValidator'
import rules from './verify'
import { $t } from '@locales/index'
import { UploadNodeConfig } from '@components/FlowChart/types'
import { useNodeHandler } from '@workflowView/lib/NodeHandler'
import Drawer from './model'
import { Ref } from 'vue'

export default defineComponent({
	name: 'UploadNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: UploadNodeConfig }>,
			default: () => ({ id: '', config: {} }),
		},
	},
	setup(props, { expose }) {
		// 使用通用节点验证
		const renderContent = (valid: boolean, config: UploadNodeConfig) => {
			return valid ? $t('t_8_1745735765753') : $t('t_9_1745735765287')
		}

		const { renderNode } = useBaseNodeValidator(props, rules, renderContent)

		// 使用通用节点处理器
		const { handleNodeClick } = useNodeHandler<UploadNodeConfig>()

		/**
		 * @description 点击节点
		 * @param {Ref<{ id: string; name: string; config: UploadNodeConfig }>} selectedNode 选中的节点
		 */
		const handleNodeClicked = (selectedNode: Ref<{ id: string; name: string; config: UploadNodeConfig }>) => {
			handleNodeClick(selectedNode, (node) => <Drawer node={node} />)
		}

		// 暴露方法给父组件
		expose({ handleNodeClick: handleNodeClicked })

		return renderNode
	},
})
