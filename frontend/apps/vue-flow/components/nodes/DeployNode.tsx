import { defineComponent } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import styles from './Node.module.css'

export default defineComponent({
	name: 'DeployNode',
	props: {
		data: {
			type: Object,
			required: true,
		},
	},
	setup(props) {
		return () => (
			<div class={`${styles.node} ${styles.deployNode}`}>
				<div class={styles.nodeContent}>
					<div class={styles.nodeIcon}>🚀</div>
					<div class={styles.nodeLabel}>{props.data.label}</div>
				</div>
				<Handle id="target" type="target" position={Position.Top} class={styles.handle} />
				<Handle id="source" type="source" position={Position.Bottom} class={styles.handle} />
			</div>
		)
	},
})
