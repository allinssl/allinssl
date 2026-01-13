import { defineComponent } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import styles from './Node.module.css'

export default defineComponent({
	name: 'StartNode',
	props: {
		data: {
			type: Object,
			required: true,
		},
	},
	setup(props) {
		return () => (
			<div class={`${styles.node} ${styles.startNode}`}>
				<div class={styles.nodeContent}>
					<div class={styles.nodeIcon}>🏁</div>
					<div class={styles.nodeLabel}>{props.data.label}</div>
				</div>
				{/* 只有出口，没有入口 */}
				<Handle id="source" type="source" position={Position.Bottom} class={styles.handle} />
			</div>
		)
	},
})
