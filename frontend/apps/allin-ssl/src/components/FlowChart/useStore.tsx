import { formatDate } from '@baota/utils/date'
import { deepMerge } from '@baota/utils/data'
import nodeOptions from '@components/FlowChart/lib/config'
import MockData from '@components/FlowChart/mock'
import type {
	NodeIcon,
	NodeNum,
	NodeTitle,
	FlowNode,
	BaseNodeData,
	NodeSelect,
	BranchNodeData,
	ExecuteResultBranchNodeData,
} from '@components/FlowChart/types'
import { BRANCH, CONDITION, EXECUTE_RESULT_BRANCH, EXECUTE_RESULT_CONDITION } from '@components/FlowChart/lib/alias'
import { $t } from '@locales/index'

/**
 * 流程图数据存储
 * 用于管理流程图的状态、缩放等数据
 */
export const useFlowStore = defineStore('flow-store', () => {
	const flowData = ref<FlowNode>({
		id: '',
		name: '',
		childNode: {
			id: 'start-1',
			name: '开始',
			type: 'start',
			config: {
				exec_type: 'manual',
			},
			childNode: null,
		},
	}) // 流程图数据
	const flowZoom = ref(100) // 流程图缩放比例
	const advancedOptions = ref(false) // 高级选项
	const addNodeSelectList = ref<NodeSelect[]>([]) // 添加节点选项列表
	const excludeNodeSelectList = ref<NodeNum[]>([]) // 排除的节点选项列表
	const addNodeBtnRef = ref<HTMLElement | null>(null) // 添加节点按钮
	const addNodeSelectRef = ref<HTMLElement | null>(null) // 添加节点选择框
	const addNodeSelectPostion = ref<number | null>(null) // 添加节点选择框位置
	const selectedNodeId = ref<string | null>(null) // 当前选中的节点ID
	const isRefreshNode = ref<string | null>(null) // 是否刷新节点

	// 计算添加节点选项列表，排除的节点选项列表
	const nodeSelectList = computed(() => {
		return addNodeSelectList.value.filter((item) => !excludeNodeSelectList.value.includes(item.type))
	})

	/**
	 * 当前选中的节点数据
	 * @type {ComputedRef<BaseNodeData | null>}
	 */
	const selectedNode = computed(() => {
		if (!selectedNodeId.value) return null
		// 使用findNodeRecursive查找节点
		return findNodeRecursive(flowData.value.childNode, selectedNodeId.value)
	})

	/**
	 * 节点标题
	 * @type {ComputedRef<string>}
	 */
	const nodeTitle = computed(() => {
		if (!selectedNode.value) return $t('t_6_1744861190121')
		return selectedNode.value.name
	})

	/**
	 * 获取添加节点选项列表
	 * @type {NodeSelect[]}
	 */
	const getAddNodeSelect = () => {
		addNodeSelectList.value = []
		Object.keys(nodeOptions).forEach((key) => {
			const item = nodeOptions[key as NodeNum]()
			if (item.operateNode?.add) {
				addNodeSelectList.value.push({
					title: { name: item.title.name } as NodeTitle,
					type: key as NodeNum,
					icon: { ...(item.icon || {}) } as NodeIcon,
					selected: false,
				})
			}
		})
	}

	/**
	 * 添加排除的节点选项列表
	 * @param {NodeNum[]} nodeTypes - 节点类型
	 */
	const addExcludeNodeSelectList = (nodeTypes: NodeNum[]) => {
		excludeNodeSelectList.value = nodeTypes
	}

	/**
	 * 清除排除的节点选项列表
	 */
	const clearExcludeNodeSelectList = () => {
		excludeNodeSelectList.value = []
	}

	/**
	 * 显示添加节点选择框
	 * @param {boolean} flag - 是否显示添加节点选择框
	 */
	const setShowAddNodeSelect = (flag: boolean, nodeType: NodeNum) => {
		// 设置排除的节点选项列表
		excludeNodeSelectList.value = nodeOptions[nodeType]().operateNode?.onSupportNode || []
		// 设置添加节点选择框位置
		if (flag && addNodeSelectRef.value && addNodeBtnRef.value) {
			const box = addNodeSelectRef.value.getBoundingClientRect() // 添加节点选择框
			const boxWidth = box.width // 添加节点选择框宽度
			const btn = addNodeBtnRef.value.getBoundingClientRect() // 添加节点按钮
			const btnRight = btn.right // 添加节点按钮右侧位置
			const windowWidth = window.innerWidth // 窗口宽度
			addNodeSelectPostion.value = btnRight + boxWidth > windowWidth ? 1 : 2
		}
	}

	/**
	 * 初始化流程图数据
	 * 创建一个默认的开始节点作为流程图的起点
	 */
	const initFlowData = () => {
		const deepMockData = JSON.parse(JSON.stringify(MockData))
		deepMockData.name = '工作流（' + formatDate(new Date(), 'yyyy/MM/dd HH:mm:ss') + '）'
		flowData.value = deepMockData
	}

	/**
	 * 重置流程图数据
	 * 清空当前流程图的所有数据
	 */
	const resetFlowData = () => initFlowData()

	/**
	 * 递归查找节点
	 * @param node 当前节点
	 * @param targetId 目标节点ID
	 * @returns 找到的节点或null
	 */
	const findNodeRecursive = (node: BaseNodeData | BranchNodeData, targetId: string): BaseNodeData | null => {
		if (node.id === targetId) return node

		// 优先检查子节点
		if (node.childNode) {
			const found = findNodeRecursive(node.childNode, targetId)
			if (found) return found
		}
		// 再检查条件节点
		if ((node as BranchNodeData).conditionNodes?.length) {
			for (const conditionNode of (node as BranchNodeData).conditionNodes) {
				const found = findNodeRecursive(conditionNode, targetId)
				if (found) return found
			}
		}

		return null
	}

	/**
	 * 通过节点id查找节点数据
	 * @param nodeId 节点id
	 * @returns 节点数据或null
	 */
	const getFlowFindNodeData = (nodeId: string): BaseNodeData | null => {
		return findNodeRecursive(flowData.value.childNode, nodeId)
	}

	/**
	 * 递归更新节点
	 * @param node 当前节点
	 * @param targetId 目标节点ID
	 * @param updateFn 更新函数
	 * @param parent 父节点
	 * @returns 是否更新成功
	 */
	const updateNodeRecursive = (
		node: BaseNodeData | BranchNodeData,
		targetId: string,
		updateFn: (node: BaseNodeData | BranchNodeData, parent: BaseNodeData | BranchNodeData | null) => void,
		parent: BaseNodeData | BranchNodeData | null = null,
	): boolean => {
		if (node.id === targetId) {
			updateFn(node, parent)
			return true
		}

		if (node.childNode) {
			if (updateNodeRecursive(node.childNode, targetId, updateFn, node)) {
				return true
			}
		}

		if ((node as BranchNodeData).conditionNodes?.length) {
			for (const conditionNode of (node as BranchNodeData).conditionNodes) {
				if (updateNodeRecursive(conditionNode, targetId, updateFn, node)) {
					return true
				}
			}
		}

		return false
	}

	/**
	 * 添加节点
	 * @param parentNodeId 父节点ID
	 * @param nodeType 节点类型
	 * @param nodeData 节点数据
	 * @param position 插入位置（对于条件节点有效）
	 */
	const addNode = (
		parentNodeId: string, // 父节点ID
		nodeType: NodeNum, // 节点类型
		nodeData: Partial<BaseNodeData | BranchNodeData> = {}, // 节点数据
	) => {
		// 获取父节点
		const parentNode = getFlowFindNodeData(parentNodeId)
		if (!parentNode) {
			console.warn(`Parent node with id ${parentNodeId} not found`)
			return
		}
		// 获取支持的节点默认配置
		let newNodeData = deepMerge(nodeOptions[nodeType]().defaultNode as BaseNodeData, nodeData) as
			| BaseNodeData
			| BranchNodeData // 获取支持的节点默认配置

		// 更新原始数据
		updateNodeRecursive(flowData.value.childNode, parentNodeId, (node, parent) => {
			switch (nodeType) {
				case CONDITION:
					// console.log('条件节点', node, parent)
					if ((node as BranchNodeData).conditionNodes) {
						newNodeData.name = `分支${(node as BranchNodeData).conditionNodes.length + 1}`
						;(node as BranchNodeData).conditionNodes.push(newNodeData)
					}
					break
				case BRANCH:
				case EXECUTE_RESULT_BRANCH:
					// 执行结果分支节点
					if (nodeType === EXECUTE_RESULT_BRANCH) {
						newNodeData = { ...newNodeData, config: { fromNodeId: parentNodeId } }
					}

					;(newNodeData as BranchNodeData).conditionNodes[0].childNode = node.childNode
					node.childNode = newNodeData
					break
				default:
					// console.log('其他节点', node, parent)
					if (node.childNode) newNodeData.childNode = node.childNode // 组件嵌套到 childNode 中
					node.childNode = newNodeData
					break
			}
		})
	}

	/**
	 * 向上查找数据类型为 apply 或 upload 的节点
	 * @param nodeId 起始节点ID
	 * @returns 符合条件的节点数组 [{name: string, id: string}]
	 */
	const findApplyUploadNodesUp = (
		nodeId: string,
		scanNode: string[] = ['apply', 'upload'],
	): Array<{ name: string; id: string }> => {
		const result: Array<{ name: string; id: string }> = []

		// 递归查找父节点的函数
		const findParentRecursive = (
			currentNode: BaseNodeData | BranchNodeData,
			targetId: string,
			path: Array<BaseNodeData | BranchNodeData> = [],
		): Array<BaseNodeData | BranchNodeData> | null => {
			// 检查当前节点是否为目标节点
			if (currentNode.id === targetId) {
				return path
			}

			// 检查子节点
			if (currentNode.childNode) {
				const newPath = [...path, currentNode]
				const found = findParentRecursive(currentNode.childNode, targetId, newPath)
				if (found) return found
			}

			// 检查条件节点
			if ((currentNode as BranchNodeData).conditionNodes?.length) {
				for (const conditionNode of (currentNode as BranchNodeData).conditionNodes) {
					const newPath = [...path, currentNode]
					const found = findParentRecursive(conditionNode, targetId, newPath)
					if (found) return found
				}
			}

			return null
		}

		// 从根节点开始查找路径
		const path = findParentRecursive(flowData.value.childNode, nodeId)
		// 如果找到路径，筛选出 apply 和 upload 类型的节点
		if (path) {
			path.forEach((node) => {
				if (scanNode.includes(node.type)) {
					result.push({
						name: node.name,
						id: node.id as string,
					})
				}
			})
		}
		return result
	}

	/**
	 * 删除节点
	 * @param nodeId 要删除的节点ID
	 * @param deep 是否深度删除（默认false，即子节点上移）
	 */
	const removeNode = (nodeId: string, deep: boolean = false) => {
		const node = getFlowFindNodeData(nodeId)
		if (!node) {
			console.warn(`Node with id ${nodeId} not found`)
			return
		}

		// 更新原始数据
		updateNodeRecursive(flowData.value.childNode, nodeId, (node, parent) => {
			if (!parent) {
				console.warn('Cannot remove root node')
				return
			}

			const { type, conditionNodes } = parent as BranchNodeData | ExecuteResultBranchNodeData
			// 处理条件节点(分支节点、执行结果分支节点)
			// console.log(type, conditionNodes, node)

			// 如果当前子节点存在条件节点，需要判断删除后是否支持条件节点，则需要更新 fromNodeId
			if (node.childNode?.type === EXECUTE_RESULT_BRANCH && node.childNode?.config) {
				node.childNode.config.fromNodeId = parent.id
			}

			// console.log(node.childNode, parent)

			// 条件一：当前节点为普通节点
			const nodeTypeList = [CONDITION, EXECUTE_RESULT_CONDITION, BRANCH, EXECUTE_RESULT_BRANCH]
			if (!nodeTypeList.includes(node.type) && parent.childNode?.id === nodeId) {
				// 处理普通节点
				if (deep) {
					// 深度删除，直接移除
					parent.childNode = undefined
				} else {
					// 非深度删除，子节点上移
					if (node.childNode) {
						parent.childNode = node.childNode
					} else {
						parent.childNode = undefined
					}
				}
				return
			}

			// 条件二：当前节点为条件节点
			if (nodeTypeList.includes(node.type)) {
				// 条件节点为分支节点或执行结果分支节点
				if (conditionNodes.length === 2) {
					// 条件节点为分支节点，则选定对立节点的子节点作为当前节点的子节点
					// console.log('条件节点为分支节点', parent)
					if (type === BRANCH) {
						updateNodeRecursive(flowData.value.childNode, parent.id as string, (nodes, parents) => {
							const index = conditionNodes.findIndex((n) => n.id === nodeId)
							const backNode = nodes.childNode
							if (index !== -1 && parents) {
								parents.childNode = conditionNodes[index === 0 ? 1 : 0].childNode // 将选定对立节点的子节点作为当前节点的子节
								const allChildNode = getNodePropertyToLast(parents, 'childNode') as BaseNodeData
								allChildNode.childNode = backNode
							}
						})
					} else {
						updateNodeRecursive(flowData.value.childNode, parent.id as string, (nodes, parents) => {
							if (parents) {
								if (parent?.childNode?.id) {
									parents.childNode = parent.childNode
								} else {
									parents.childNode = undefined
								}
							}
						})
					}
				} else {
					const index = (parent as BranchNodeData).conditionNodes.findIndex((n) => n.id === nodeId)
					if (index !== -1) {
						if (deep) {
							// 深度删除，直接移除
							;(parent as BranchNodeData).conditionNodes.splice(index, 1)
						} else {
							// 非深度删除，子节点上移
							const targetNode = (parent as BranchNodeData).conditionNodes[index]
							if (targetNode?.childNode) {
								;(parent as BranchNodeData).conditionNodes[index] = targetNode.childNode
							} else {
								;(parent as BranchNodeData).conditionNodes.splice(index, 1)
							}
						}
					}
				}
			}
		})

		return flowData.value
	}

	/**
	 * 递归查询节点属性直到最后一层
	 * @param node 当前节点
	 * @param property 要查询的属性名
	 * @returns 最后一层的属性值
	 */
	const getNodePropertyToLast = (node: BaseNodeData, property: string) => {
		if (!node) return null
		const value = (node as any)[property]
		if (!value) return node
		// 如果属性值是一个对象，继续递归查询
		if (typeof value === 'object' && value !== null) {
			return getNodePropertyToLast(value, property)
		}
	}

	/**
	 * 更新节点配置
	 * @param nodeId 节点ID
	 * @param config 新的配置数据
	 */
	const updateNodeConfig = (nodeId: string, config: Record<string, any>) => {
		const node = getFlowFindNodeData(nodeId)
		if (!node) {
			console.warn(`Node with id ${nodeId} not found`)
			return
		}
		// 更新原始数据
		updateNodeRecursive(flowData.value.childNode, nodeId, (node) => {
			node.config = config
		})
		return flowData.value
	}

	/**
	 * 更新节点数据
	 * @param nodeId 要更新的节点ID
	 * @param newNodeData 新的节点数据
	 */
	const updateNode = (nodeId: string, newNodeData: Partial<FlowNode>, isMergeArray: boolean = true) => {
		const node = getFlowFindNodeData(nodeId)
		if (!node) {
			console.warn(`Node with id ${nodeId} not found`)
			return
		}

		// 更新原始数据
		updateNodeRecursive(flowData.value.childNode, nodeId, (node) => {
			const updatedNode = deepMerge(node, newNodeData, isMergeArray) as BaseNodeData
			Object.keys(updatedNode).forEach((key) => {
				if (key in node) {
					;(node as any)[key] = updatedNode[key as keyof typeof updatedNode]
				}
			})
		})

		return flowData.value
	}

	/**
	 * 检查节点是否存在子节点
	 * @param nodeId 节点id
	 * @returns 是否存在子节点
	 */
	const checkFlowNodeChild = (nodeId: string): boolean => {
		const node = getFlowFindNodeData(nodeId)
		return node ? !!(node.childNode || (node as BranchNodeData).conditionNodes?.length) : false
	}

	/**
	 * 检查是否存在行内节点
	 * @param nodeId 节点id
	 */
	const checkFlowInlineNode = (nodeId: string) => {
		const node = getFlowFindNodeData(nodeId)
		if (!node || node.type !== 'condition') return

		// 更新原始数据
		updateNodeRecursive(flowData.value.childNode, nodeId, (node) => {
			if ((node as BranchNodeData).conditionNodes) {
				;(node as BranchNodeData).conditionNodes = (node as BranchNodeData).conditionNodes.filter(
					(n) => n.id !== nodeId,
				)
			}
		})
	}

	// /**
	//  * @description 显示节点选择
	//  * @param {boolean} flag
	//  * @param {NodeNum} nodeData
	//  */
	// const showNodeSelect = (flag: boolean, nodeType?: NodeNum) => {
	// 	if (!flag) {
	// 		clearTimeout(timer.value as number)
	// 		timer.value = window.setTimeout(() => {
	// 			isShowAddNodeSelect.value = flag
	// 		}, 1000) as unknown as null
	// 	} else {
	// 		isShowAddNodeSelect.value = false
	// 		isShowAddNodeSelect.value = flag
	// 	}
	// 	// 设置添加节点选择状态
	// 	if (nodeType) {
	// 		flowStore.setShowAddNodeSelect(flag, nodeType)
	// 	}
	// }

	/**
	 * 获取流程图数据
	 * 返回当前流程图数据的深拷贝，避免直接修改原始数据
	 * @returns {Object} 流程图数据的副本
	 */
	const getResultData = () => {
		return deepMerge({}, flowData.value)
	}

	/**
	 * 更新流程图数据
	 * 用新的数据替换当前的流程图数据
	 * @param {Object} newData - 新的流程图数据
	 */
	const updateFlowData = (newData: FlowNode) => {
		flowData.value = newData
	}

	/**
	 * 设置流程图缩放比例
	 * 控制流程图的显示大小
	 * @param {number} type - 缩放类型：1 表示缩小，2 表示放大
	 */
	const setflowZoom = (type: number) => {
		if (type === 1 && flowZoom.value > 50) {
			flowZoom.value -= 10
		} else if (type === 2 && flowZoom.value < 300) {
			flowZoom.value += 10
		}
	}

	return {
		// 数据
		flowData, // 流程图数据
		flowZoom, // 流程图缩放比例
		selectedNode, // 当前选中的节点
		nodeTitle, // 当前选中的节点标题
		selectedNodeId, // 当前选中的节点ID
		isRefreshNode, // 是否刷新节点
		advancedOptions, // 高级选项

		// 方法
		initFlowData, // 初始化流程图数据
		resetFlowData, // 重置流程图数据
		getResultData, // 获取流程图数据
		updateFlowData, // 更新流程图数据
		setflowZoom, // 设置流程图缩放比例

		// 添加节点-数据
		addNodeSelectList, // 添加节点选项列表
		nodeSelectList, // 计算添加节点选项列表，排除的节点选项列表
		excludeNodeSelectList, // 排除的节点选项列表
		addNodeBtnRef, // 添加节点按钮
		addNodeSelectRef, // 添加节点选择框
		addNodeSelectPostion, // 添加节点选择框位置

		// 添加节点-方法
		getAddNodeSelect, // 获取添加节点选项列表
		addExcludeNodeSelectList, // 添加排除的节点选项列表
		clearExcludeNodeSelectList, // 清除排除的节点选项列表
		setShowAddNodeSelect, // 设置显示添加节点选择框

		// 节点操作
		addNode,
		removeNode,
		updateNodeConfig,
		updateNode,
		findApplyUploadNodesUp, // 向上查找 apply 和 upload 类型节点
		checkFlowNodeChild, // 检查节点是否存在子节点
		checkFlowInlineNode, // 检查是否存在行内节点
	}
})

/**
 * 使用流程图数据存储
 * 提供流程图数据存储的引用和解构
 * @returns {Object} 包含流程图数据存储的引用和解构
 */
export const useStore = () => {
	const flowStore = useFlowStore()
	const storeRef = storeToRefs(flowStore)
	return {
		...flowStore,
		...storeRef,
	}
}
