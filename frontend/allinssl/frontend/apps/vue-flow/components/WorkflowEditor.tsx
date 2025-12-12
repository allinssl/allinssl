import { defineComponent, onMounted, ref } from 'vue'
import { VueFlow, Position, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { useWorkflowStore } from '../store/workflow'
import { processWorkflowData } from '../store/transformFlowData'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '../flow.css'
import styles from './WorkflowEditor.module.css'

// 导入新的节点组件
import NewStartNode from './nodes/NewStartNode'
import NewApplyNode from './nodes/NewApplyNode'
import NewBranchNode from './nodes/NewBranchNode'
import NewDeployNode from './nodes/NewDeployNode'
import NewUploadNode from './nodes/NewUploadNode'
import NewNotifyNode from './nodes/NewNotifyNode'

// 示例数据
const exampleFlowData = {
	id: '10001',
	name: '请假审批',
	childNode: {
		id: 'dfag-123',
		name: '开始',
		type: 'start',
		config: {
			time: '2025-04-11 10:00:00',
			type: 'manual',
		},
		childNode: {
			id: 'dfag-124',
			name: '申请证书',
			type: 'apply',
			config: {
				name: null,
			},
			childNode: {
				id: 'dfag-125',
				name: '分支节点',
				type: 'branch',
				conditionNodes: [
					{
						id: 'dfag-126',
						name: '部署网站',
						type: 'execute_result_branch',
						childNode: {
							id: 'dfag-128',
							name: '执行结果',
							type: 'execute_result_branch',
							conditionNodes: [
								{
									id: 'dfag-129',
									name: '执行成功',
									type: 'execute_result_condition',
									config: {
										type: 'SUCCESS',
									},
								},
								{
									id: 'dfag-130',
									name: '执行失败',
									type: 'execute_result_condition',
									config: {
										type: 'FAILURE',
									},
								},
							],
						},
					},
					{
						id: 'dfag-131',
						name: '申请xxx证书',
						type: 'condition',
						config: {
							days: 3,
						},
						childNode: {
							id: 'dfag-132',
							name: '申请证书',
							type: 'apply',
							childNode: {
								id: 'dfag-133',
								name: '执行结果',
								type: 'execute_result_branch',
								conditionNodes: [
									{
										id: 'dfag-134',
										name: '执行成功',
										type: 'condition',
										config: {
											type: 'SUCCESS',
										},
									},
									{
										id: 'dfag-135',
										name: '执行失败',
										type: 'condition',
										config: {
											type: 'FAILURE',
										},
									},
								],
							},
						},
					},
					{
						id: 'dfag-131a',
						name: '申请xxx证书2',
						type: 'condition',
						config: {
							days: 3,
						},
						childNode: {
							id: 'dfag-132b',
							name: '申请证书',
							type: 'apply',
							childNode: {
								id: 'dfag-133v',
								name: '执行结果',
								type: 'execute_result_branch',
								conditionNodes: [
									{
										id: 'dfag-134f',
										name: '执行成功',
										type: 'condition',
										config: {
											type: 'SUCCESS',
										},
									},
									{
										id: 'dfag-135s',
										name: '执行失败',
										type: 'condition',
										config: {
											type: 'FAILURE',
										},
									},
								],
							},
						},
					},
					{
						id: 'dfag-131a2222',
						name: '申请xxx证书2',
						type: 'condition',
						config: {
							days: 3,
						},
						childNode: {
							id: 'dfag-132b2222',
							name: '申请证书',
							type: 'apply',
							childNode: {
								id: 'dfag-133v1111',
								name: '执行结果',
								type: 'execute_result_branch',
								conditionNodes: [
									{
										id: 'dfag-134faaa',
										name: '执行成功',
										type: 'condition',
										config: {
											type: 'SUCCESS',
										},
									},
									{
										id: 'dfag-135sccc',
										name: '执行失败',
										type: 'condition',
										config: {
											type: 'FAILURE',
										},
									},
								],
							},
						},
					},
				],
				childNode: {
					id: 'dfag-1aa36',
					name: '通知任务',
					type: 'notify',
					config: {
						name: '李四',
					},
				},
			},
		},
	},
}

// 工作流编辑器组件
export default defineComponent({
	name: 'WorkflowEditor',
	setup() {
		const workflowStore = useWorkflowStore()

		// 选中的节点ID
		const selectedNodeId = ref<string | null>(null)

		// 初始化工作流
		onMounted(() => {
			// 将示例数据转换为VueFlow所需的节点和边
			const { nodes, edges } = processWorkflowData(exampleFlowData.childNode)

			// 禁用所有节点的拖拽
			const nodesWithoutDrag = nodes.map((node) => ({
				...node,
				draggable: false, // 禁止拖拽
				data: {
					...node.data,
					canMove: false, // 禁止移动
				},
			}))

			// 加载到工作流中
			workflowStore.loadWorkflow({ nodes: nodesWithoutDrag, edges })

			// 设置工作流标题
			if (exampleFlowData.name) {
				workflowStore.setWorkflowTitle(exampleFlowData.name)
			}

			// 监听打开节点配置面板事件
			window.addEventListener('open-node-config', (e: any) => {
				const { nodeId, nodeType, nodeData } = e.detail
				console.log('打开节点配置', nodeId, nodeType, nodeData)
				// 调用打开配置面板的方法
				workflowStore.selectNode(nodeData)
			})
		})

		// 是否显示确认保存对话框
		const showSaveDialog = ref(false)

		// 保存工作流
		const saveWorkflow = () => {
			workflowStore.saveWorkflow()
			showSaveDialog.value = false
		}

		// 删除节点
		const deleteNode = (nodeId: string) => {
			if (nodeId) {
				// 获取当前节点列表和边列表的副本
				const newNodes = workflowStore.nodes.filter((node) => node.id !== nodeId)
				const newEdges = workflowStore.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)

				// 更新store中的节点和边
				workflowStore.nodes = newNodes
				workflowStore.edges = newEdges

				// 清除选中状态
				selectedNodeId.value = null
				workflowStore.selectNode(null)
			}
		}

		// 复制节点
		const duplicateNode = (nodeId: string) => {
			const node = workflowStore.nodes.find((node) => node.id === nodeId)
			if (node) {
				// 创建新节点（副本）
				const newNode = {
					...node,
					id: `${node.id}-copy`,
					position: {
						x: node.position.x + 50,
						y: node.position.y + 50,
					},
				}

				// 更新store中的节点
				workflowStore.nodes = [...workflowStore.nodes, newNode]
			}
		}

		return () => (
			<div class={styles.workflowEditor}>
				<div class={styles.editorHeader}>
					<div class={styles.title}>
						<input
							type="text"
							value={workflowStore.workflowTitle}
							onInput={(e) => workflowStore.setWorkflowTitle((e.target as HTMLInputElement).value)}
							placeholder="输入工作流名称"
							class={styles.titleInput}
						/>
					</div>
					<div class={styles.actions}>
						{workflowStore.isDataChanged && (
							<button class={styles.saveButton} onClick={() => saveWorkflow()}>
								保存
							</button>
						)}
					</div>
				</div>

				<div class={styles.editorContent}>
					<VueFlow
						nodes={workflowStore.nodes}
						edges={workflowStore.edges}
						onNodeClick={(event, node) => {
							selectedNodeId.value = node.id
							workflowStore.selectNode(node)
						}}
						onPaneClick={() => {
							selectedNodeId.value = null
							workflowStore.selectNode(null)
						}}
						onNodesChange={workflowStore.onNodesChange}
						onEdgesChange={workflowStore.onEdgesChange}
						onConnect={workflowStore.onConnect}
						minZoom={0.2}
						maxZoom={4}
						defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
						fitViewOnInit
						fitView
						fitViewOptions={{
							padding: 0.4,
							includeHiddenNodes: false,
							maxZoom: 0.7,
						}}
						connectionLineType="smoothstep"
						connectionLineStyle={{
							stroke: '#b1b1b7',
							strokeWidth: 2,
						}}
						defaultEdgeOptions={{
							type: 'smoothstep',
							style: {
								strokeWidth: 2,
							},
							animated: true,
							markerEnd: {
								type: MarkerType.ArrowClosed,
								width: 15,
								height: 15,
								color: '#b1b1b7',
							},
						}}
						nodeTypes={{
							// 注册新的节点类型
							start: NewStartNode,
							apply: NewApplyNode,
							branch: NewBranchNode,
							deploy: NewDeployNode,
							upload: NewUploadNode,
							notify: NewNotifyNode,
						}}
						snapToGrid={true}
						snapGrid={[10, 10]}
						elevateEdgesOnSelect
						nodesDraggable={false}
						nodesConnectable={false}
						elementsSelectable={true}
						panOnScroll
						zoomOnScroll={false}
					>
						<Background gap={20} size={1} color="#e5e5e5" variant="dots" />
						<MiniMap zoomable pannable nodeStrokeWidth={3} maskColor="rgba(240, 240, 240, 0.6)" nodeBorderRadius={2} />
						<Controls showInteractive={true} />

						{/* 节点工具栏 */}
						<NodeToolbar
							nodeId={selectedNodeId.value || ''}
							position={Position.Top}
							offset={10}
							isVisible={!!selectedNodeId.value}
						>
							<div class="node-toolbar">
								<button
									class="toolbar-btn delete-btn"
									onClick={() => deleteNode(selectedNodeId.value || '')}
									title="删除节点"
								>
									删除
								</button>
								<button
									class="toolbar-btn duplicate-btn"
									onClick={() => duplicateNode(selectedNodeId.value || '')}
									title="复制节点"
								>
									复制
								</button>
							</div>
						</NodeToolbar>
					</VueFlow>
				</div>
			</div>
		)
	},
})
