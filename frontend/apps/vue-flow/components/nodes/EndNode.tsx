import { defineComponent } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import styles from './Node.module.css'

export default defineComponent({
	name: 'EndNode',
	props: {
		data: {
			type: Object,
			required: true,
		},
	},
	setup(props) {
		return () => (
			<div class={`${styles.node} ${styles.endNode}`}>
				<div class={styles.nodeContent}>
					<div class={styles.nodeIcon}>🏁</div>
					<div class={styles.nodeLabel}>{props.data.label}</div>
				</div>
				{/* 只有入口，没有出口 */}
				<Handle id="target" type="target" position={Position.Top} class={styles.handle} />
			</div>
		)
	},
})
