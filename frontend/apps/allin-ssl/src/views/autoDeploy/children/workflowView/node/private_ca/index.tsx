import { Ref } from 'vue'
import { defineComponent, PropType } from 'vue'
import { useBaseNodeValidator } from '@workflowView/lib/BaseNodeValidator'
import { $t } from '@locales/index'
import rules from './verify'
import Drawer from './model'
import { useNodeHandler } from '@workflowView/lib/NodeHandler'
import type { PrivateCaNodeConfig } from '@components/FlowChart/types'

interface NodeProps {
	node: {
		id: string
		config: PrivateCaNodeConfig
	}
}

export default defineComponent({
	name: 'PrivateCaNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: PrivateCaNodeConfig }>,
			default: () => ({ id: '', config: {} }),
		},
	},
	setup(props: NodeProps, { expose }) {
		/**
		 * @description 渲染节点内容
		 * @param {boolean} valid 是否有效
		 * @param {PrivateCaNodeConfig} config 节点配置
		 * @returns {string} 渲染节点内容
		 */
		const renderContent = (valid: boolean, config: PrivateCaNodeConfig) => {
			if (valid) {
				return config?.name ? `自签证书: ${config.name}` : '自签证书'
			}
			return '未配置'
		}

		const { renderNode } = useBaseNodeValidator(props, rules, renderContent)

		// 使用通用节点处理器
		const { handleNodeClick } = useNodeHandler<PrivateCaNodeConfig>()

		// 暴露方法给父组件
		expose({
			handleNodeClick: (selectedNode: Ref<{ id: string; name: string; config: PrivateCaNodeConfig }>) =>
				handleNodeClick(selectedNode, (node) => <Drawer node={node} />),
		})

		// 返回渲染函数
		return renderNode
	},
})