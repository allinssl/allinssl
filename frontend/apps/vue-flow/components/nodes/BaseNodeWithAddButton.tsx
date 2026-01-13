import { defineComponent, ref, computed } from 'vue'
import { Handle, Position, useVueFlow, NodeProps } from '@vue-flow/core'
import styles from './Node.module.css'
import { NodeData, ICON_MAP, NodeType } from '../../types'

// 节点类型定义
export const NODE_TYPES = {
	APPLY: 'apply',
	BRANCH: 'branch',
	DEPLOY: 'deploy',
	UPLOAD: 'upload',
	NOTIFY: 'notify',
}

export default defineComponent({
	name: 'BaseNodeWithAddButton',
	props: {
		id: { type: String, required: true },
		data: { type: Object, required: true },
		selected: { type: Boolean, default: false },
		connectable: { type: Boolean, default: true },
		nodeClassName: { type: String, default: '' },
		icon: { type: String, default: '' },
		isClickable: { type: Boolean, default: false },
		onClick: { type: Function, default: () => {} },
	},
	emits: ['add-node'],
	setup(props, { slots, emit }) {
		const showMenu = ref(false)
		const vueFlowInstance = useVueFlow()

		// 获取节点图标
		const nodeIcon = computed(() => {
			const nodeType = props.data.type as NodeType
			return props.icon || props.data.icon || ICON_MAP[nodeType] || '📄'
		})

		// 处理添加按钮点击
		const handleAddClick = (e: MouseEvent) => {
			e.stopPropagation()
			showMenu.value = !showMenu.value
		}

		// 处理节点点击
		const handleNodeClick = (e: MouseEvent) => {
			if (props.isClickable) {
				e.stopPropagation()
				props.onClick(props.data)
			}
		}

		// 添加新节点
		const addNewNode = (type: string) => {
			// 获取当前节点信息
			const currentNode = vueFlowInstance.findNode(props.id)
			if (!currentNode) return

			// 创建新节点ID
			const newNodeId = `${type}-${Date.now()}`

			// 根据不同类型节点设置不同图标和标签
			let nodeLabel = '新节点'

			switch (type) {
				case NODE_TYPES.APPLY:
					nodeLabel = '申请证书'
					break
				case NODE_TYPES.BRANCH:
					nodeLabel = '分支节点'
					break
				case NODE_TYPES.DEPLOY:
					nodeLabel = '部署证书'
					break
				case NODE_TYPES.UPLOAD:
					nodeLabel = '上传证书'
					break
				case NODE_TYPES.NOTIFY:
					nodeLabel = '通知'
					break
			}

			// 计算新节点位置
			const nodeHeight = 120 // 节点固定高度
			const verticalGap = 150 // 节点之间的垂直间距
			const newY = currentNode.position.y + nodeHeight + verticalGap

			// 创建新节点
			const newNode = {
				id: newNodeId,
				type: type,
				position: {
					x: currentNode.position.x,
					y: newY,
				},
				data: {
					id: newNodeId,
					type: type as NodeType,
					label: nodeLabel,
					icon: ICON_MAP[type as NodeType],
					canMove: false,
					canDelete: true,
					canChangeType: true,
				},
			}

			// 创建连接边
			const newEdge = {
				id: `${props.id}-${newNodeId}`,
				source: props.id,
				target: newNodeId,
				type: 'smoothstep',
				animated: true,
				style: { strokeWidth: 2 },
				sourceHandle: 'bottom',
				targetHandle: 'top',
			}

			// 添加节点和边
			vueFlowInstance.addNodes([newNode])
			vueFlowInstance.addEdges([newEdge])

			// 关闭菜单
			showMenu.value = false

			// 触发添加节点事件
			emit('add-node', { nodeId: newNodeId, nodeType: type })
		}

		// 处理点击外部关闭菜单
		const handleOutsideClick = () => {
			showMenu.value = false
		}

		return () => (
			<div
				class={`
          ${styles.node} 
          ${props.nodeClassName} 
        `}
			>
				<div
					class={`
            ${styles.nodeBody} 
            ${props.selected ? styles.nodeSelected : ''}
            ${props.isClickable ? styles.nodeClickable : ''}
          `}
					onClick={handleNodeClick}
				>
					<div class={styles.nodeHeader}>
						<span class={styles.nodeIcon}>{nodeIcon.value}</span>
						<span class={styles.nodeLabel}>{props.data.label}</span>
					</div>

					<div class={styles.nodeBody}>{slots.default && slots.default()}</div>

					{/* 添加节点按钮 */}
					<div class={styles.addNodeBtn} onClick={handleAddClick}>
						+
					</div>

					{/* 菜单选项 - 使用 v-show 控制显示 */}
					<div class={styles.nodeMenu} style={{ display: showMenu.value ? 'flex' : 'none', zIndex: 99999 }}>
						<div class={styles.menuItem} onClick={() => addNewNode(NODE_TYPES.APPLY)}>
							<span class={styles.menuItemIcon}>{ICON_MAP['apply' as NodeType]}</span>
							<span class={styles.menuItemLabel}>申请证书节点</span>
						</div>
						<div class={styles.menuItem} onClick={() => addNewNode(NODE_TYPES.DEPLOY)}>
							<span class={styles.menuItemIcon}>{ICON_MAP['deploy' as NodeType]}</span>
							<span class={styles.menuItemLabel}>部署证书节点</span>
						</div>
						<div class={styles.menuItem} onClick={() => addNewNode(NODE_TYPES.UPLOAD)}>
							<span class={styles.menuItemIcon}>{ICON_MAP['upload' as NodeType]}</span>
							<span class={styles.menuItemLabel}>上传证书节点</span>
						</div>
						<div class={styles.menuItem} onClick={() => addNewNode(NODE_TYPES.NOTIFY)}>
							<span class={styles.menuItemIcon}>{ICON_MAP['notify' as NodeType]}</span>
							<span class={styles.menuItemLabel}>通知节点</span>
						</div>
						<div class={styles.menuItem} onClick={() => addNewNode(NODE_TYPES.BRANCH)}>
							<span class={styles.menuItemIcon}>{ICON_MAP['branch' as NodeType]}</span>
							<span class={styles.menuItemLabel}>分支节点</span>
						</div>
					</div>
				</div>

				{/* 连接点 */}
				<Handle id="target" type="target" position={Position.Top} class={styles.handle} />
				<Handle id="bottom" type="source" position={Position.Bottom} class={styles.handle} />
			</div>
		)
	},
})
