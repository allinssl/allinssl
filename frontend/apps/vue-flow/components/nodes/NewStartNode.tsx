import { defineComponent } from 'vue'
import { NodeProps } from '@vue-flow/core'
import styles from './Node.module.css'
import BaseNodeWithAddButton from './BaseNodeWithAddButton'
import { NodeType } from '../../types'

export default defineComponent({
	name: 'NewStartNode',
	props: {
		id: { type: String, required: true },
		data: { type: Object, required: true },
		selected: { type: Boolean, default: false },
		connectable: { type: Boolean, default: true },
	},
	emits: ['add-node'],
	setup(props, { emit }) {
		// 处理添加节点事件
		const handleAddNode = (nodeData: any) => {
			console.log('添加节点成功:', nodeData)
			emit('add-node', nodeData)
		}

		return () => (
			<BaseNodeWithAddButton
				id={props.id}
				data={props.data}
				selected={props.selected}
				connectable={props.connectable}
				nodeClassName={styles.startNode}
				onAdd-node={handleAddNode}
			/>
		)
	},
})
