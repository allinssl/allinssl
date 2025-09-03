import { defineComponent } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import styles from './Node.module.css'

export default defineComponent({
	name: 'NotifyNode',
	props: {
		data: {
			type: Object,
			required: true,
		},
	},
	setup(props) {
		return () => (
			<div class={`${styles.node} ${styles.notifyNode}`}>
				<div class={styles.nodeContent}>
					<div class={styles.nodeIcon}>📢</div>
					<div class={styles.nodeLabel}>{props.data.label}</div>
					<div class={styles.nodeStatus}>
						<div class={styles.statusItem}>
							<div class={styles.statusLabel}>成功</div>
							<div class={styles.statusDot} style={{ backgroundColor: '#10b981' }}></div>
						</div>
						<div class={styles.statusItem}>
							<div class={styles.statusLabel}>失败</div>
							<div class={styles.statusDot} style={{ backgroundColor: '#ef4444' }}></div>
						</div>
					</div>
				</div>
				<Handle id="target" type="target" position={Position.Top} class={styles.handle} />
				<Handle
					id="source-success"
					type="source"
					position={Position.Bottom}
					class={`${styles.handle} ${styles.handleSuccess}`}
				/>
				<Handle
					id="source-failure"
					type="source"
					position={Position.Bottom}
					class={`${styles.handle} ${styles.handleFailure}`}
					style={{ left: '80%' }}
				/>
			</div>
		)
	},
})
