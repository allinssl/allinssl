import { BRANCH, EXECUTE_RESULT_BRANCH } from '@components/FlowChart/lib/alias'
import BranchNode from '@components/FlowChart/components/base/branchNode'
import ConditionNode from '@components/FlowChart/components/base/conditionNode'
import BaseNode from '@components/FlowChart/components/base/baseNode'
import NodeWrap from '@components/FlowChart/components/render/nodeWrap'

import type {
	BaseNodeData,
	BranchNodeData,
	ExecuteResultBranchNodeData,
	NodeWrapProps,
} from '@components/FlowChart/types'

// 自定义样式
const styles = {
	flowNodeWrap: 'flex flex-col items-center w-full relative',
	flowNodeWrapNested: 'nested-node-wrap w-full',
	flowNodeWrapDeep: 'deep-nested-node-wrap w-full',
}

export default defineComponent({
	name: 'NodeWrap',
	props: {
		// 节点数据
		node: {
			type: Object as PropType<BaseNodeData | BranchNodeData | ExecuteResultBranchNodeData>,
			default: () => ({}),
		},
		// 嵌套深度
		depth: {
			type: Number,
			default: 0,
		},
	},
	setup(props: NodeWrapProps) {
		// 计算当前节点的嵌套深度样式类
		const getDepthClass = () => {
			if (props.depth && props.depth > 1) {
				return props.depth > 2 ? styles.flowNodeWrapDeep : styles.flowNodeWrapNested
			}
			return styles.flowNodeWrap
		}

		return {
			getDepthClass,
		}
	},
	render() {
		if (!this.node) return null
		const currentDepth = this.depth || 0
		const nextDepth = currentDepth + 1

		return (
			<div class={this.getDepthClass()}>
				{/* 判断是否为分支节点或普通节点 */}
				{this.node.type === BRANCH ? <BranchNode node={this.node as BranchNodeData} /> : null}

				{/* 判断是否为条件节点 */}
				{this.node.type === EXECUTE_RESULT_BRANCH ? (
					<ConditionNode node={this.node as ExecuteResultBranchNodeData} />
				) : null}

				{/* 判断是否为普通节点 */}
				{![BRANCH, EXECUTE_RESULT_BRANCH].includes(this.node.type) ? <BaseNode node={this.node} /> : null}

				{/* 判断是否存在子节点 */}
				{this.node.childNode?.type && <NodeWrap node={this.node.childNode} depth={nextDepth} />}
			</div>
		)
	},
})
