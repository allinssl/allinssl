import { defineComponent } from 'vue'
import WorkflowEditor from './components/WorkflowEditor'
import WorkflowNodeConfig from './components/WorkflowNodeConfig'
import styles from './index.module.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import './flow.css'

/**
 * 工作流组件
 */
export default defineComponent({
	name: 'VueFlowWorkflow',
	setup() {
		return () => (
			<div class={styles.workflowContainer}>
				<div class={styles.workflowEditor}>
					<WorkflowEditor />
				</div>
				<div class={styles.workflowConfig}>
					<WorkflowNodeConfig />
				</div>
			</div>
		)
	},
})
