import { v4 as uuidv4 } from 'uuid'
import { WorkflowNode, WorkflowEdge, NodeData } from '../types'
import { MarkerType } from '@vue-flow/core'

// 节点类型映射
const NODE_TYPE_MAP = {
	start: 'start',
	apply: 'apply',
	branch: 'normal', // 使用普通节点作为分支节点
	condition: 'normal', // 条件节点
	deploy: 'deploy',
	execute_result_branch: 'normal', // 执行结果分支节点
	execute_result_condition: 'normal', // 执行结果条件节点
	notify: 'notify',
}

// 节点标签映射
const NODE_LABEL_MAP = {
	start: '开始',
	apply: '申请证书',
	branch: '分支节点',
	condition: '条件节点',
	deploy: '部署证书',
	execute_result_branch: '执行结果',
	execute_result_condition: '执行结果条件',
	notify: '通知',
}

// 布局配置
const LAYOUT_CONFIG = {
	// 节点尺寸
	nodeWidth: 180,
	nodeHeight: 40,
	// 节点间距
	horizontalGap: 220, // 水平间距，增加防止重叠
	verticalGap: 150, // 垂直间距，增加更多空间
	// 分支节点的水平间距
	branchHorizontalGap: 280, // 增加分支节点间距
	// 多分支的间距调整系数
	multiBranchSpacingFactor: 0.9, // 多分支时适当减小间距，确保视野内能容纳
	// 初始位置
	initialX: 600, // 增加初始X坐标，使整个图更居中
	initialY: 80,
}

interface NestedNode {
	id: string
	name: string
	type: string
	config?: any
	childNode?: NestedNode
	conditionNodes?: NestedNode[]
	inputs?: Array<{ name: string; fromNodeId: string }>
}

interface ProcessResult {
	nodes: WorkflowNode[]
	edges: WorkflowEdge[]
}

/**
 * 节点子树的大小信息
 */
interface SubtreeSize {
	width: number // 子树宽度
	height: number // 子树高度
	childCount: number // 子节点数量
}

/**
 * 将嵌套节点数据结构转换为VueFlow所需的节点和边
 * @param data 嵌套的节点数据
 * @returns VueFlow的节点和边
 */
export function transformNestedFlowData(data: NestedNode): ProcessResult {
	const result: ProcessResult = {
		nodes: [],
		edges: [],
	}

	if (!data) return result

	// 垂直对齐布局的实现
	const nodePositions = new Map<string, { x: number; y: number }>()
	const yLevels = new Map<number, number>() // 每个层级的y坐标

	// 计算层级
	const nodeLevels = new Map<string, number>()
	const nodeParents = new Map<string, string>() // 保存节点的父节点
	const nodeTrees = new Map<string, NestedNode>() // 保存所有节点引用，便于访问
	const nodeSubtreeSize = new Map<string, SubtreeSize>() // 保存每个节点子树的大小信息
	const conditionEndNodes = new Map<string, string[]>() // 保存分支节点的所有结束节点IDs

	// 第一步：遍历节点树，确定每个节点的层级和父节点，并收集所有节点
	function assignLevels(node: NestedNode | undefined, level: number = 0, parentId: string | null = null) {
		if (!node) return

		// 保存节点信息
		nodeLevels.set(node.id, level)
		nodeTrees.set(node.id, node)

		if (parentId) {
			nodeParents.set(node.id, parentId)
		}

		// 处理条件分支节点
		if (node.conditionNodes && node.conditionNodes.length > 0) {
			const hasChildNode = node.childNode !== undefined

			// 条件节点层级 +1
			for (const condNode of node.conditionNodes) {
				assignLevels(condNode, level + 1, node.id)

				// 递归处理条件节点的子节点
				if (condNode.childNode) {
					// 条件节点的子节点层级 +2
					assignLevels(condNode.childNode, level + 2, condNode.id)

					// 如果条件分支有子节点，要递归找到所有末端节点
					findAllEndNodes(condNode.childNode, node.id)
				} else {
					// 如果条件节点没有子节点，它自己就是终止节点
					if (!conditionEndNodes.has(node.id)) {
						conditionEndNodes.set(node.id, [])
					}
					conditionEndNodes.get(node.id)?.push(condNode.id)
				}
			}

			// 处理普通子节点 - 如果同时存在conditionNodes和childNode
			if (hasChildNode && node.childNode) {
				// 如果节点同时有条件分支和子节点，子节点级别设为独立的，不直接关联到父节点
				// 放在比所有条件分支末端节点更低的层级
				const maxConditionLevel = findMaxConditionEndLevel(node)
				assignLevels(node.childNode, maxConditionLevel + 1, null)
			}
		} else if (node.childNode) {
			// 普通子节点，层级+1
			assignLevels(node.childNode, level + 1, node.id)
		}
	}

	// 查找条件分支的最大末端层级
	function findMaxConditionEndLevel(node: NestedNode): number {
		let maxLevel = nodeLevels.get(node.id) || 0

		// 获取当前分支的所有末端节点
		const endNodeIds = conditionEndNodes.get(node.id) || []

		// 找出最大层级
		for (const endId of endNodeIds) {
			const level = nodeLevels.get(endId) || 0
			maxLevel = Math.max(maxLevel, level)
		}

		// 至少比父节点高2个层级
		return Math.max(maxLevel, nodeLevels.get(node.id)! + 2)
	}

	// 递归查找分支下所有末端节点
	function findAllEndNodes(node: NestedNode, branchParentId: string) {
		// 初始化终止节点集合
		if (!conditionEndNodes.has(branchParentId)) {
			conditionEndNodes.set(branchParentId, [])
		}

		// 如果有条件分支，则不是末端节点，需要继续递归
		if (node.conditionNodes && node.conditionNodes.length > 0) {
			for (const condNode of node.conditionNodes) {
				if (condNode.childNode) {
					findAllEndNodes(condNode.childNode, branchParentId)
				} else {
					// 条件节点没有子节点，它是末端节点
					conditionEndNodes.get(branchParentId)?.push(condNode.id)
				}
			}

			// 如果还有子节点，继续递归查找
			if (node.childNode) {
				findAllEndNodes(node.childNode, branchParentId)
			}
		}
		// 如果还有子节点，不是末端节点，继续递归
		else if (node.childNode) {
			findAllEndNodes(node.childNode, branchParentId)
		}
		// 没有子节点，也没有条件分支，它是末端节点
		else {
			conditionEndNodes.get(branchParentId)?.push(node.id)
		}
	}

	// 第二步：计算每个节点子树的大小，自底向上
	function calculateSubtreeSizes(nodeId: string): SubtreeSize {
		const node = nodeTrees.get(nodeId)
		if (!node) {
			return { width: 0, height: 0, childCount: 0 }
		}

		// 如果已经计算过，直接返回
		if (nodeSubtreeSize.has(nodeId)) {
			return nodeSubtreeSize.get(nodeId)!
		}

		// 默认大小
		let subtreeWidth = LAYOUT_CONFIG.nodeWidth
		let maxChildWidth = 0
		let totalChildWidth = 0
		let childCount = 0

		// 计算条件分支的子树大小
		if (node.conditionNodes && node.conditionNodes.length > 0) {
			for (const condNode of node.conditionNodes) {
				// 计算条件节点子树大小
				const condSize = calculateSubtreeSizes(condNode.id)
				totalChildWidth += condSize.width
				maxChildWidth = Math.max(maxChildWidth, condSize.width)
				childCount += condSize.childCount + 1 // +1 是条件节点本身

				// 如果条件节点有子节点，也要计算
				if (condNode.childNode) {
					const childSize = calculateSubtreeSizes(condNode.childNode.id)
					totalChildWidth += childSize.width
					maxChildWidth = Math.max(maxChildWidth, childSize.width)
					childCount += childSize.childCount + 1 // +1 是子节点本身
				}
			}

			// 多个条件分支的总宽度
			if (node.conditionNodes.length > 1) {
				// 条件分支节点之间需要间距
				subtreeWidth = Math.max(
					subtreeWidth,
					totalChildWidth + (node.conditionNodes.length - 1) * LAYOUT_CONFIG.branchHorizontalGap,
				)
			} else {
				subtreeWidth = Math.max(subtreeWidth, maxChildWidth)
			}
		}

		// 计算普通子节点的子树大小
		if (node.childNode) {
			const childSize = calculateSubtreeSizes(node.childNode.id)
			subtreeWidth = Math.max(subtreeWidth, childSize.width)
			childCount += childSize.childCount + 1 // +1 是子节点本身
		}

		// 保存并返回结果
		const result = { width: subtreeWidth, height: 0, childCount }
		nodeSubtreeSize.set(nodeId, result)
		return result
	}

	// 第三步：计算每个层级的Y坐标
	function calculateYCoordinates() {
		const maxLevel = Math.max(...Array.from(nodeLevels.values()))

		for (let i = 0; i <= maxLevel; i++) {
			yLevels.set(i, LAYOUT_CONFIG.initialY + i * LAYOUT_CONFIG.verticalGap)
		}
	}

	// 第四步：计算节点的X坐标位置，考虑子树宽度避免重叠
	function positionNodes(nodeId: string, leftBoundary: number = 0): number {
		const node = nodeTrees.get(nodeId)
		if (!node) return leftBoundary

		const level = nodeLevels.get(nodeId) || 0
		const subtreeSize = nodeSubtreeSize.get(nodeId) || { width: LAYOUT_CONFIG.nodeWidth, height: 0, childCount: 0 }

		// 计算节点的x坐标 - 居中于其子树
		const x = leftBoundary + subtreeSize.width / 2

		// 保存节点位置
		nodePositions.set(nodeId, {
			x: x,
			y: yLevels.get(level)!,
		})

		// 初始左边界，用于子节点布局
		let childLeftBoundary = leftBoundary

		// 处理条件分支
		if (node.conditionNodes && node.conditionNodes.length > 0) {
			const conditionCount = node.conditionNodes.length

			// 计算所有条件分支以及它们子节点的总宽度
			let totalConditionWidth = 0
			const conditionSizes: { nodeId: string; width: number }[] = []

			// 先收集所有条件分支的宽度信息
			for (const condNode of node.conditionNodes) {
				const condSize = nodeSubtreeSize.get(condNode.id) || {
					width: LAYOUT_CONFIG.nodeWidth,
					height: 0,
					childCount: 0,
				}

				// 计算这个条件分支的总宽度（包括所有子节点）
				let branchWidth = condSize.width

				// 如果有子节点，需要考虑子节点的宽度
				if (condNode.childNode) {
					// 递归计算子树的宽度
					const childTreeWidth = calculateBranchWidth(condNode.childNode)
					branchWidth = Math.max(branchWidth, childTreeWidth)
				}

				conditionSizes.push({ nodeId: condNode.id, width: branchWidth })
				totalConditionWidth += branchWidth
			}

			// 根据分支数量动态调整间距
			let adjustedGap = LAYOUT_CONFIG.branchHorizontalGap
			// 当分支数量大于2时，适当减小间距
			if (conditionCount > 2) {
				adjustedGap =
					LAYOUT_CONFIG.branchHorizontalGap * Math.pow(LAYOUT_CONFIG.multiBranchSpacingFactor, conditionCount - 2)
			}

			// 添加分支之间的间距
			totalConditionWidth += (conditionCount - 1) * adjustedGap

			// 计算条件分支区域的起始位置，确保条件分支居中于父节点
			childLeftBoundary = x - totalConditionWidth / 2

			// 布局每个条件分支
			for (const condInfo of conditionSizes) {
				const condNode = nodeTrees.get(condInfo.nodeId)
				if (!condNode) continue

				// 定位条件节点
				const condX = childLeftBoundary + condInfo.width / 2

				// 保存条件节点位置
				nodePositions.set(condNode.id, {
					x: condX,
					y: yLevels.get(level + 1)!,
				})

				// 处理条件子节点
				if (condNode.childNode) {
					// 递归布局条件子节点及其子树
					positionBranch(condNode.childNode, condX, level + 2, condInfo.width)
				}

				// 更新下一个条件分支的位置
				childLeftBoundary += condInfo.width + adjustedGap
			}

			// 如果节点同时有条件分支和普通子节点，独立处理子节点的位置
			if (node.childNode) {
				const childNodeId = node.childNode.id
				// 获取子节点的层级（已经在assignLevels中计算为条件分支末端之后）
				const childLevel = nodeLevels.get(childNodeId) || level + 3

				// 保存子节点位置 - 与父节点垂直对齐
				nodePositions.set(childNodeId, {
					x: x,
					y: yLevels.get(childLevel)!,
				})

				// 递归处理子节点的子节点
				if (node.childNode.childNode || (node.childNode.conditionNodes && node.childNode.conditionNodes.length > 0)) {
					positionNodes(childNodeId, x - subtreeSize.width / 2)
				}
			}
		} else if (node.childNode) {
			// 处理普通子节点 - 垂直对齐于父节点下方
			const childNodeId = node.childNode.id
			const childLevel = level + 1

			// 保存节点位置
			nodePositions.set(childNodeId, {
				x: x, // 与父节点垂直对齐
				y: yLevels.get(childLevel)!,
			})

			// 递归处理其子节点
			if (node.childNode.childNode || (node.childNode.conditionNodes && node.childNode.conditionNodes.length > 0)) {
				positionNodes(childNodeId, leftBoundary)
			}
		}

		return leftBoundary + subtreeSize.width
	}

	// 计算分支的总宽度（包括所有子节点）
	function calculateBranchWidth(node: NestedNode): number {
		const nodeSize = nodeSubtreeSize.get(node.id) || {
			width: LAYOUT_CONFIG.nodeWidth,
			height: 0,
			childCount: 0,
		}

		let totalWidth = nodeSize.width

		// 如果有条件分支，计算所有分支的总宽度
		if (node.conditionNodes && node.conditionNodes.length > 0) {
			let branchesWidth = 0
			const branchCount = node.conditionNodes.length

			// 获取每个分支的宽度
			const branchWidths: number[] = []
			for (const condNode of node.conditionNodes) {
				const condWidth = calculateBranchWidth(condNode)
				branchWidths.push(condWidth)
				branchesWidth += condWidth
			}

			// 根据分支数量动态调整间距
			let adjustedGap = LAYOUT_CONFIG.branchHorizontalGap
			// 当分支数量大于2时，适当减小间距，避免超出视野
			if (branchCount > 2) {
				adjustedGap =
					LAYOUT_CONFIG.branchHorizontalGap * Math.pow(LAYOUT_CONFIG.multiBranchSpacingFactor, branchCount - 2)
			}

			// 加上分支间距
			if (branchCount > 1) {
				branchesWidth += (branchCount - 1) * adjustedGap
			}

			totalWidth = Math.max(totalWidth, branchesWidth)
		}

		// 如果有子节点，递归计算
		if (node.childNode) {
			const childWidth = calculateBranchWidth(node.childNode)
			totalWidth = Math.max(totalWidth, childWidth)
		}

		return totalWidth
	}

	// 递归定位分支中的所有节点
	function positionBranch(node: NestedNode, centerX: number, level: number, availableWidth: number): void {
		// 保存节点位置 - 垂直对齐于父节点
		nodePositions.set(node.id, {
			x: centerX,
			y: yLevels.get(level)!,
		})

		// 如果有条件分支，递归处理
		if (node.conditionNodes && node.conditionNodes.length > 0) {
			// 类似于positionNodes中的处理逻辑
			const conditionCount = node.conditionNodes.length
			let totalWidth = 0
			const condSizes: { nodeId: string; width: number }[] = []

			// 计算所有条件分支的宽度
			for (const condNode of node.conditionNodes) {
				const width = calculateBranchWidth(condNode)
				condSizes.push({ nodeId: condNode.id, width })
				totalWidth += width
			}

			// 根据分支数量动态调整间距
			let adjustedGap = LAYOUT_CONFIG.branchHorizontalGap
			// 当分支数量大于2时，适当减小间距
			if (conditionCount > 2) {
				adjustedGap =
					LAYOUT_CONFIG.branchHorizontalGap * Math.pow(LAYOUT_CONFIG.multiBranchSpacingFactor, conditionCount - 2)
			}

			// 添加分支间距
			totalWidth += (conditionCount - 1) * adjustedGap

			// 计算起始位置，确保居中
			let startX = centerX - totalWidth / 2

			// 处理每个条件分支
			for (const condInfo of condSizes) {
				const condNode = nodeTrees.get(condInfo.nodeId)
				if (!condNode) continue

				// 分支节点居中
				const condX = startX + condInfo.width / 2

				// 保存位置
				nodePositions.set(condNode.id, {
					x: condX,
					y: yLevels.get(level + 1)!,
				})

				// 处理子节点
				if (condNode.childNode) {
					positionBranch(condNode.childNode, condX, level + 2, condInfo.width)
				}

				// 更新下一个分支的位置
				startX += condInfo.width + adjustedGap
			}

			// 处理子节点
			if (node.childNode) {
				// 获取子节点层级
				const childLevel =
					Math.max(
						...Array.from(nodeLevels.entries())
							.filter(([id]) => nodeParents.get(id) === node.id)
							.map(([, level]) => level),
					) + 1

				// 定位子节点
				positionBranch(node.childNode, centerX, childLevel, availableWidth)
			}
		}
		// 如果有子节点但没有条件分支
		else if (node.childNode) {
			positionBranch(node.childNode, centerX, level + 1, availableWidth)
		}
	}

	// 第五步：创建节点和边
	function createNodesAndEdges(node: NestedNode | undefined, parentId: string | null = null) {
		if (!node) return

		// 获取节点位置
		const position = nodePositions.get(node.id)
		if (!position) return // 跳过没有位置信息的节点

		// 节点类型和标签
		const nodeType = NODE_TYPE_MAP[node.type as keyof typeof NODE_TYPE_MAP] || 'normal'
		const nodeLabel = node.name || NODE_LABEL_MAP[node.type as keyof typeof NODE_LABEL_MAP] || '未知节点'

		// 创建节点数据
		const nodeData: NodeData = {
			id: node.id,
			type: nodeType as any,
			label: nodeLabel,
			canMove: true,
			canDelete: true,
			canChangeType: true,
		}

		// 添加配置信息
		if (node.config) {
			Object.assign(nodeData, { config: node.config })
		}

		// 创建节点
		const flowNode: WorkflowNode = {
			id: node.id,
			type: nodeType,
			position: { x: position.x, y: position.y },
			data: nodeData,
		}

		// 添加节点
		result.nodes.push(flowNode)

		// 添加从父节点到当前节点的边（如果有父节点）
		if (parentId) {
			const edgeId = `${parentId}-${node.id}`
			const parentPosition = nodePositions.get(parentId)
			if (parentPosition) {
				// 计算边缘路径的偏移量，避免与节点重叠
				const offset = LAYOUT_CONFIG.nodeHeight / 2 + 10 // 节点高度的一半加上额外间距
				const sourceY = parentPosition.y + offset
				const targetY = position.y - offset

				const edge: WorkflowEdge = {
					id: edgeId,
					source: parentId,
					target: node.id,
					type: 'step',
					style: {
						strokeWidth: 2,
						strokeDasharray: 5,
					},
					animated: true,
					// 添加箭头标记
					markerEnd: {
						type: MarkerType.ArrowClosed,
						width: 15,
						height: 15,
						color: '#b1b1b7',
					},
					// 添加路径偏移
					sourceY,
					targetY,
				}
				result.edges.push(edge)
			}
		}

		// 特殊处理 - 同时有条件分支和子节点的情况
		const hasConditionNodesAndChildNode = node.conditionNodes && node.conditionNodes.length > 0 && node.childNode

		// 处理条件分支节点
		if (node.conditionNodes && node.conditionNodes.length > 0) {
			// 处理每个条件分支
			for (const condNode of node.conditionNodes) {
				// 创建条件节点及其子节点
				createNodesAndEdges(condNode, node.id)

				if (condNode.childNode) {
					createNodesAndEdges(condNode.childNode, condNode.id)
				}
			}

			// 如果同时存在子节点，将所有条件分支末端节点连接到该子节点
			if (hasConditionNodesAndChildNode) {
				const childNodeId = node.childNode!.id
				const endNodeIds = conditionEndNodes.get(node.id) || []

				// 为每个条件分支的末端节点创建到子节点的连接
				for (const endNodeId of endNodeIds) {
					// 避免重复创建边
					const edgeId = `${endNodeId}-${childNodeId}`

					// 检查是否已经存在此边
					const edgeExists = result.edges.some((edge) => edge.id === edgeId)

					if (!edgeExists) {
						const endNodePosition = nodePositions.get(endNodeId)
						const childNodePosition = nodePositions.get(childNodeId)

						if (endNodePosition && childNodePosition) {
							// 计算边缘路径的偏移量
							const offset = LAYOUT_CONFIG.nodeHeight / 2 + 10
							const sourceY = endNodePosition.y + offset
							const targetY = childNodePosition.y - offset

							const edge: WorkflowEdge = {
								id: edgeId,
								source: endNodeId,
								target: childNodeId,
								type: 'step',
								style: {
									strokeWidth: 2,
									strokeDasharray: 5,
								},
								animated: true,
								markerEnd: {
									type: MarkerType.ArrowClosed,
									width: 15,
									height: 15,
									color: '#b1b1b7',
								},
								// 添加路径偏移
								sourceY,
								targetY,
							}
							result.edges.push(edge)
						}
					}
				}

				// 独立创建子节点，不从父节点连接
				createNodesAndEdges(node.childNode, null)
			}
		}

		// 处理常规子节点（如果不是与条件分支共存的情况）
		if (node.childNode && !hasConditionNodesAndChildNode) {
			createNodesAndEdges(node.childNode, node.id)
		}
	}

	// 执行布局算法
	assignLevels(data)
	// 计算子树大小（从根节点开始）
	calculateSubtreeSizes(data.id)
	calculateYCoordinates()
	// 计算节点位置，从根节点开始，初始左边界为0
	positionNodes(data.id, 0)
	createNodesAndEdges(data)

	return result
}

/**
 * 处理工作流数据，从 JSON 结构转换为 VueFlow 所需的节点和边
 * @param workflowData 工作流 JSON 数据
 * @returns VueFlow的节点和边
 */
export function processWorkflowData(workflowData: any): ProcessResult {
	if (!workflowData) {
		return { nodes: [], edges: [] }
	}

	// 处理嵌套数据结构
	return transformNestedFlowData(workflowData)
}
