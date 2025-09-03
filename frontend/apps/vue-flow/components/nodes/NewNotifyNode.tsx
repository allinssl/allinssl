import { defineComponent } from 'vue'
import BaseNodeWithAddButton from './BaseNodeWithAddButton'
import styles from './Node.module.css'
import { NodeProps } from '@vue-flow/core'

export default defineComponent({
	name: 'NewNotifyNode',
	props: {
		id: { type: String, required: true },
		data: { type: Object, required: true },
		selected: { type: Boolean, default: false },
		connectable: { type: Boolean, default: true },
	},
	setup(props) {
		const handleNodeClick = (nodeData: any) => {
			// 在这里可以打开节点配置面板
			console.log('配置通知节点', nodeData)
			// 触发事件通知父组件打开配置面板
			const event = new CustomEvent('open-node-config', {
				detail: {
					nodeId: nodeData.id,
					nodeType: 'notify',
					nodeData: nodeData,
				},
			})
			window.dispatchEvent(event)
		}

		const handleAddNode = (data: any) => {
			console.log('添加节点成功', data)
		}

		// 获取通知类型显示文本
		const getNotifyTypeText = () => {
			switch (props.data.notifyType) {
				case 'email':
					return '邮件通知'
				case 'sms':
					return '短信通知'
				case 'webhook':
					return 'Webhook通知'
				default:
					return props.data.notifyType || '默认通知'
			}
		}

		return () => (
			<BaseNodeWithAddButton
				id={props.id}
				data={props.data}
				selected={props.selected}
				connectable={props.connectable}
				nodeClassName={styles.notifyNode}
				icon="📣"
				isClickable={true}
				onClick={handleNodeClick}
				onAdd-node={handleAddNode}
			>
				{/* 通知节点可以显示通知类型和内容 */}
				{props.data.notifyType && <div class={styles.nodeMessage}>类型: {getNotifyTypeText()}</div>}
				{props.data.message && (
					<div class={styles.nodeMessage}>
						{props.data.message.substring(0, 20)}
						{props.data.message.length > 20 ? '...' : ''}
					</div>
				)}
			</BaseNodeWithAddButton>
		)
	},
})
