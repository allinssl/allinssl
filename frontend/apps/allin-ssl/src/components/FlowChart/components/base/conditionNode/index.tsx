import { v4 as uuidv4 } from 'uuid'
import nodeOptions from '@components/FlowChart/lib/config'
import { useStore } from '@components/FlowChart/useStore'
import { CONDITION } from '@components/FlowChart/lib/alias'

import NodeWrap from '@components/FlowChart/components/render/nodeWrap'
import AddNode from '@components/FlowChart/components/other/addNode'
import styles from '../branchNode/index.module.css'
import type { BaseRenderNodeOptions, ExecuteResultBranchNodeData } from '@components/FlowChart/types'

export default defineComponent({
	name: 'BranchNode',
	props: {
		node: {
			type: Object as () => ExecuteResultBranchNodeData,
			default: () => ({}),
		},
	},

	setup(props: { node: ExecuteResultBranchNodeData }) {
		const { addNode } = useStore() // 流程图数据
		const config = ref<BaseRenderNodeOptions<ExecuteResultBranchNodeData>>(nodeOptions[props.node.type]() || {}) // 节点配置

		watch(
			() => props.node.type,
			(newVal) => {
				config.value = nodeOptions[newVal]() || {}
			},
		)

		// 添加条件
		const addCondition = () => {
			const tempNodeId = uuidv4() // 临时节点id
			addNode(
				props.node.id || '',
				CONDITION,
				{
					id: tempNodeId,
					name: `分支${(props.node.conditionNodes?.length || 0) + 1}`,
				},
				props.node.conditionNodes?.length,
			)
		}

		// 计算容器类名，根据分支数量调整样式
		const getContainerClass = () => {
			const count = props.node.conditionNodes?.length || 0
			const baseClass = styles.flowNodeBranch

			// 分支数量多时添加特殊类
			if (count > 3) {
				return `${baseClass} ${styles.multipleColumns}`
			}

			return baseClass
		}

		// 计算分支盒子类名，处理多层嵌套情况
		const getBoxClass = () => {
			// 检查是否有嵌套的分支节点
			const hasNestedBranch = props.node.conditionNodes?.some(
				(node) => node.childNode && ['branch', 'execute_result_branch'].includes(node.childNode.type),
			)
			const baseClass = styles.flowNodeBranchBox
			if (hasNestedBranch) {
				return `${baseClass} ${styles.hasNestedBranch}`
			}
			return baseClass
		}

		return () => (
			<div class={getContainerClass()}>
				{config.value.operateNode?.addBranch && (
					<div class={styles.flowConditionNodeAdd} onClick={addCondition}>
						{config.value.operateNode?.addBranchTitle || '添加分支'}
					</div>
				)}
				<div class={getBoxClass()}>
					{props.node.conditionNodes?.map((condition, index: number) => (
						<div
							class={styles.flowNodeBranchCol}
							key={index}
							data-branch-index={index}
							data-branches-count={props.node.conditionNodes?.length}
						>
							{/* 条件节点 */}
							<NodeWrap node={condition} />
							{/* 用来遮挡最左列的线 */}
							{index === 0 && (
								<div>
									<div class={`${styles.coverLine} ${styles.topLeftCoverLine}`} />
									<div class={`${styles.coverLine} ${styles.bottomLeftCoverLine}`} />
									<div class={`${styles.rightCoverLine}`} />
								</div>
							)}
							{/* 用来遮挡最右列的线 */}
							{index === (props.node.conditionNodes?.length || 0) - 1 && (
								<div>
									<div class={`${styles.coverLine} ${styles.topRightCoverLine}`} />
									<div class={`${styles.coverLine} ${styles.bottomRightCoverLine}`} />
									<div class={`${styles.leftCoverLine}`} />
								</div>
							)}
						</div>
					))}
				</div>
				<AddNode node={props.node} />
			</div>
		)
	},
})
