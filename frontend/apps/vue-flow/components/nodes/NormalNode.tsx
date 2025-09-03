import { defineComponent } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import styles from './Node.module.css'

export default defineComponent({
	name: 'NormalNode',
	props: {
		data: {
			type: Object,
			required: true,
		},
	},
	setup(props) {
		// 根据状态获取图标
		const getStatusIcon = () => {
			switch (props.data.status) {
				case 'success':
					return '✅'
				case 'error':
					return '❌'
				default:
					return 'ℹ️'
			}
		}

		return () => (
			<div class={`${styles.node} ${styles.normalNode}`}>
				<div class={styles.nodeContent}>
					<div class={styles.nodeIcon}>{getStatusIcon()}</div>
					<div class={styles.nodeLabel}>{props.data.label}</div>
					{props.data.message && <div class={styles.nodeMessage}>{props.data.message}</div>}
				</div>
				<Handle id="target" type="target" position={Position.Top} class={styles.handle} />
				<Handle id="source" type="source" position={Position.Bottom} class={styles.handle} />
			</div>
		)
	},
})
