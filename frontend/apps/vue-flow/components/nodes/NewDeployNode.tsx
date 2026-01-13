import { defineComponent } from 'vue'
import BaseNodeWithAddButton from './BaseNodeWithAddButton'
import styles from './Node.module.css'
import { NodeProps } from '@vue-flow/core'

export default defineComponent({
	name: 'NewDeployNode',
	props: {
		id: { type: String, required: true },
		data: { type: Object, required: true },
		selected: { type: Boolean, default: false },
		connectable: { type: Boolean, default: true },
	},
	setup(props) {
		const handleNodeClick = (nodeData: any) => {
			// 在这里可以打开节点配置面板
			console.log('配置部署证书节点', nodeData)
			// 触发事件通知父组件打开配置面板
			const event = new CustomEvent('open-node-config', {
				detail: {
					nodeId: nodeData.id,
					nodeType: 'deploy',
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
				nodeClassName={styles.deployNode}
				icon="🚀"
				isClickable={true}
				onClick={handleNodeClick}
				onAdd-node={handleAddNode}
			>
				{/* 部署节点可以显示部署目标 */}
				{props.data.deployTarget && <div class={styles.nodeMessage}>部署到: {props.data.deployTarget}</div>}
			</BaseNodeWithAddButton>
		)
	},
})
