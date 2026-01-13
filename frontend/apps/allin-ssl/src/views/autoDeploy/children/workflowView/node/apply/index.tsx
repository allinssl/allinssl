import { Ref } from 'vue'
import { defineComponent, PropType } from 'vue'
import { useBaseNodeValidator } from '@workflowView/lib/BaseNodeValidator'
import { $t } from '@locales/index'
import rules from './verify'
import Drawer from './model'
import { useNodeHandler } from '@workflowView/lib/NodeHandler'
import type { ApplyNodeConfig } from '@components/FlowChart/types'

interface NodeProps {
	node: {
		id: string
		config: ApplyNodeConfig
	}
}

export default defineComponent({
	name: 'ApplyNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: ApplyNodeConfig }>,
			default: () => ({ id: '', config: {} }),
		},
	},
	setup(props: NodeProps, { expose }) {
		/**
		 * @description 渲染节点内容
		 * @param {boolean} valid 是否有效
		 * @param {ApplyNodeConfig} config 节点配置
		 * @returns {string} 渲染节点内容
		 */
		const renderContent = (valid: boolean, config: ApplyNodeConfig) => {
			if (valid) return $t('t_9_1747817611448') + config?.domains
			return $t('t_9_1745735765287')
		}

		const { renderNode } = useBaseNodeValidator(props, rules, renderContent)

		// 使用通用节点处理器
		const { handleNodeClick } = useNodeHandler<ApplyNodeConfig>()

		// 暴露方法给父组件
		expose({
			handleNodeClick: (selectedNode: Ref<{ id: string; name: string; config: ApplyNodeConfig }>) =>
				handleNodeClick(selectedNode, (node) => <Drawer node={node} />),
		})

		// 返回渲染函数
		return renderNode
	},
})
