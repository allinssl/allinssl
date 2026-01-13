import { Node, Edge, DefaultEdge, MarkerType } from '@vue-flow/core'

// 节点类型常量
export const NODE_START = 'start'
export const NODE_END = 'end'
export const NODE_UPLOAD = 'upload'
export const NODE_DEPLOY = 'deploy'
export const NODE_NOTIFY = 'notify'
export const NODE_APPLY = 'apply'
export const NODE_NORMAL = 'normal'
export const NODE_BRANCH = 'branch'

// 节点类型
export type NodeType =
	| typeof NODE_START
	| typeof NODE_END
	| typeof NODE_UPLOAD
	| typeof NODE_DEPLOY
	| typeof NODE_NOTIFY
	| typeof NODE_APPLY
	| typeof NODE_NORMAL
	| typeof NODE_BRANCH

// 图标映射
export const ICON_MAP = {
	[NODE_START]: '▶️',
	[NODE_END]: '⏹️',
	[NODE_UPLOAD]: '📤',
	[NODE_DEPLOY]: '🚀',
	[NODE_NOTIFY]: '📣',
	[NODE_APPLY]: '📝',
	[NODE_NORMAL]: '📄',
	[NODE_BRANCH]: '🔀',
}

// 基础节点数据
export interface BaseNodeData {
	id: string
	type: NodeType
	label: string
	canMove?: boolean
	canDelete?: boolean
	canChangeType?: boolean
	icon?: string
}

// 开始节点数据
export interface StartNodeData extends BaseNodeData {
	type: typeof NODE_START
}

// 结束节点数据
export interface EndNodeData extends BaseNodeData {
	type: typeof NODE_END
}

// 上传证书节点数据
export interface UploadNodeData extends BaseNodeData {
	type: typeof NODE_UPLOAD
	certificateContent?: string
	certificateFile?: File
}

// 部署证书节点数据
export interface DeployNodeData extends BaseNodeData {
	type: typeof NODE_DEPLOY
	certificateContent?: string
	deployTarget?: string
}

// 通知节点数据
export interface NotifyNodeData extends BaseNodeData {
	type: typeof NODE_NOTIFY
	message?: string
	notifyType?: string
}

// 申请节点数据
export interface ApplyNodeData extends BaseNodeData {
	type: typeof NODE_APPLY
	applicationContent?: string
}

// 分支节点数据
export interface BranchNodeData extends BaseNodeData {
	type: typeof NODE_BRANCH
	branchCount?: number
	conditions?: Array<{
		id: string
		label: string
		condition: string
	}>
}

// 普通节点数据
export interface NormalNodeData extends BaseNodeData {
	type: typeof NODE_NORMAL
	message?: string
	status?: 'success' | 'error' | 'info'
}

// 所有节点数据类型
export type NodeData =
	| StartNodeData
	| EndNodeData
	| UploadNodeData
	| DeployNodeData
	| NotifyNodeData
	| ApplyNodeData
	| NormalNodeData
	| BranchNodeData

// 工作流节点
export type WorkflowNode = Node<NodeData>

// 工作流边
export interface WorkflowEdge extends DefaultEdge {
	id: string
	source: string
	target: string
	type: string
	style?: Record<string, any>
	animated?: boolean
	markerEnd?: {
		type: MarkerType
		width: number
		height: number
		color: string
	}
	// 源和目标连接点处理
	sourceHandle?: string
	targetHandle?: string
	// 路径控制数据
	data?: {
		pathPoints?: Array<{
			x: number
			y: number
		}>
	}
}

// 工作流数据
export interface WorkflowData {
	nodes: WorkflowNode[]
	edges: WorkflowEdge[]
}
