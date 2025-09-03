import { defineComponent, ref } from 'vue'
import BaseNodeWithAddButton from './BaseNodeWithAddButton'
import styles from './Node.module.css'
import { NodeProps } from '@vue-flow/core'

export default defineComponent({
	name: 'NewApplyNode',
	props: {
		id: { type: String, required: true },
		data: { type: Object, required: true },
		selected: { type: Boolean, default: false },
		connectable: { type: Boolean, default: true },
	},
	setup(props) {
		const handleNodeClick = (nodeData: any) => {
			// 在这里可以打开节点配置面板
			console.log('配置申请证书节点', nodeData)
			// 触发事件通知父组件打开配置面板
			const event = new CustomEvent('open-node-config', {
				detail: {
					nodeId: nodeData.id,
					nodeType: 'apply',
					nodeData: nodeData,
				},
			})
			window.dispatchEvent(event)
		}

		const handleAddNode = (data: any) => {
			console.log('添加节点成功', data)
		}

		return () => (
			<BaseNodeWithAddButton
				id={props.id}
				data={props.data}
				selected={props.selected}
				connectable={props.connectable}
				nodeClassName={styles.applyNode}
				icon="📝"
				isClickable={true}
				onClick={handleNodeClick}
				onAdd-node={handleAddNode}
			>
				{/* 节点内容部分可以在这里添加 */}
				{props.data.applicationContent && (
					<div class={styles.nodeMessage}>
						{props.data.applicationContent.substring(0, 20)}
						{props.data.applicationContent.length > 20 ? '...' : ''}
					</div>
				)}
			</BaseNodeWithAddButton>
		)
	},
})
