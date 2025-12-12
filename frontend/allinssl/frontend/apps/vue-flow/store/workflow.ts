import { defineStore } from 'pinia'
import { useVueFlow } from '@vue-flow/core'
import { v4 as uuidv4 } from 'uuid'
import {
	WorkflowData,
	WorkflowNode,
	WorkflowEdge,
	NodeData,
	NODE_START,
	NODE_END,
	NODE_UPLOAD,
	NODE_DEPLOY,
	NODE_NOTIFY,
	NODE_APPLY,
	NODE_NORMAL,
	NodeType,
} from '../types'

export const useWorkflowStore = defineStore('workflow', () => {
	// 初始化Vue Flow
	const { onNodesChange, onEdgesChange, onConnect, findNode } = useVueFlow()
	// 节点和边的状态
	const nodes = ref<WorkflowNode[]>([])
	const edges = ref<WorkflowEdge[]>([])
	// 当前选中的节点
	const selectedNode = ref<WorkflowNode | null>(null)
	// 工作流标题
	const workflowTitle = ref('新建工作流')
	// 是否显示保存按钮
	const isDataChanged = ref(false)

	/**
	 * 初始化工作流数据
	 */
	function initWorkflow() {
		// 创建初始节点
		const startNode: WorkflowNode = {
			id: 'start-node',
			type: NODE_START,
			position: { x: 250, y: 50 },
			data: {
				id: 'start-node',
				type: NODE_START,
				label: '开始',
				canMove: false,
				canDelete: false,
				canChangeType: false,
			},
		}

		const endNode: WorkflowNode = {
			id: 'end-node',
			type: NODE_END,
			position: { x: 250, y: 350 },
			data: {
				id: 'end-node',
				type: NODE_END,
				label: '结束',
				canMove: false,
				canDelete: false,
				canChangeType: false,
			},
		}

		// 设置初始节点
		nodes.value = [startNode, endNode]
		edges.value = []

		// 标记数据已变更
		isDataChanged.value = true
	}

	/**
	 * 选择节点
	 * @param node 节点
	 */
	function selectNode(node: WorkflowNode | null) {
		selectedNode.value = node
	}

	/**
	 * 添加节点
	 * @param nodeType 节点类型
	 * @param sourceNodeId 源节点ID
	 */
	function addNode(nodeType: NodeType, sourceNodeId: string) {
		// 创建新节点ID
		const newNodeId = uuidv4()

		// 获取源节点
		const sourceNode = findNode(sourceNodeId)
		if (!sourceNode) return

		// 计算新节点位置 (在源节点下方100px)
		const position = {
			x: sourceNode.position.x,
			y: sourceNode.position.y + 100,
		}

		// 创建节点基础数据
		const baseNodeData = {
			id: newNodeId,
			type: nodeType,
			label: getNodeLabel(nodeType),
			canMove: true,
			canDelete: true,
			canChangeType: true,
		}

		// 根据节点类型创建不同的节点数据
		let nodeData: NodeData

		switch (nodeType) {
			case NODE_UPLOAD:
				nodeData = { ...baseNodeData, type: NODE_UPLOAD }
				break
			case NODE_DEPLOY:
				nodeData = { ...baseNodeData, type: NODE_DEPLOY }
				break
			case NODE_NOTIFY:
				nodeData = { ...baseNodeData, type: NODE_NOTIFY }
				break
			case NODE_APPLY:
				nodeData = { ...baseNodeData, type: NODE_APPLY }
				break
			case NODE_NORMAL:
				nodeData = { ...baseNodeData, type: NODE_NORMAL, status: 'info' }
				break
			default:
				nodeData = baseNodeData as NodeData
		}

		// 创建新节点
		const newNode: WorkflowNode = {
			id: newNodeId,
			type: nodeType,
			position,
			data: nodeData,
		}

		// 添加节点
		nodes.value = [...nodes.value, newNode]

		// 创建连接边
		const newEdge: WorkflowEdge = {
			id: `${sourceNodeId}-${newNodeId}`,
			source: sourceNodeId,
			target: newNodeId,
		}

		// 添加边
		edges.value = [...edges.value, newEdge]

		// 选中新节点
		selectNode(newNode)

		// 标记数据已变更
		isDataChanged.value = true
	}

	/**
	 * 更新节点数据
	 * @param nodeId 节点ID
	 * @param data 节点数据
	 */
	function updateNodeData(nodeId: string, data: Partial<NodeData>) {
		// 查找节点
		const node = findNode(nodeId)
		if (!node) return

		// 更新节点数据
		nodes.value = nodes.value.map((n) => {
			if (n.id === nodeId) {
				return {
					...n,
					data: {
						...n.data,
						...data,
					} as NodeData,
				}
			}
			return n
		})

		// 更新选中节点
		if (selectedNode.value?.id === nodeId) {
			selectNode({
				...selectedNode.value,
				data: {
					...selectedNode.value.data,
					...data,
				} as NodeData,
			} as WorkflowNode)
		}

		// 标记数据已变更
		isDataChanged.value = true
	}

	/**
	 * 获取节点标签
	 * @param nodeType 节点类型
	 * @returns 节点标签
	 */
	function getNodeLabel(nodeType: NodeType): string {
		switch (nodeType) {
			case NODE_START:
				return '开始'
			case NODE_END:
				return '结束'
			case NODE_UPLOAD:
				return '上传证书'
			case NODE_DEPLOY:
				return '部署证书'
			case NODE_NOTIFY:
				return '通知'
			case NODE_APPLY:
				return '申请'
			case NODE_NORMAL:
				return '普通节点'
			default:
				return '未知节点'
		}
	}

	/**
	 * 保存工作流
	 */
	function saveWorkflow() {
		// // 这里可以实现保存逻辑，如API调用等
		// console.log('保存工作流', {
		// 	title: workflowTitle.value,
		// 	nodes: nodes.value,
		// 	edges: edges.value,
		// })

		// 重置数据变更标记
		isDataChanged.value = false
	}

	/**
	 * 加载工作流数据
	 * @param data 工作流数据
	 */
	function loadWorkflow(data: WorkflowData) {
		if (data && data.nodes && data.edges) {
			nodes.value = data.nodes
			edges.value = data.edges
			isDataChanged.value = false
		}
	}

	/**
	 * 设置工作流标题
	 * @param title 标题
	 */
	function setWorkflowTitle(title: string) {
		workflowTitle.value = title
		isDataChanged.value = true
	}

	return {
		// 状态
		nodes,
		edges,
		selectedNode,
		workflowTitle,
		isDataChanged,

		// 方法
		initWorkflow,
		selectNode,
		addNode,
		updateNodeData,
		saveWorkflow,
		loadWorkflow,
		setWorkflowTitle,

		// Vue Flow方法
		onNodesChange,
		onEdgesChange,
		onConnect,
	}
})
