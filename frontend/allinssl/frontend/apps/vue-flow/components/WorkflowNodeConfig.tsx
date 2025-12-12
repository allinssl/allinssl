import { defineComponent } from 'vue'
import { useWorkflowStore } from '../store/workflow'
import styles from './WorkflowNodeConfig.module.css'

export default defineComponent({
	name: 'WorkflowNodeConfig',
	setup() {
		const workflowStore = useWorkflowStore()

		return () => {
			const selectedNode = workflowStore.selectedNode

			// 如果没有选中节点，显示默认内容
			if (!selectedNode) {
				return (
					<div class={styles.nodeConfig}>
						<div class={styles.emptyConfig}>
							<div class={styles.emptyIcon}>🔍</div>
							<div class={styles.emptyText}>请选择一个节点进行配置</div>
						</div>
					</div>
				)
			}

			// 渲染节点配置内容
			return (
				<div class={styles.nodeConfig}>
					<div class={styles.nodeConfigHeader}>
						<div class={styles.nodeConfigTitle}>{selectedNode.data?.label || '未命名节点'}</div>
					</div>
					<div class={styles.nodeConfigContent}>
						<div class={styles.configField}>
							<div class={styles.configLabel}>节点ID</div>
							<div class={styles.configValue}>{selectedNode.id}</div>
						</div>

						<div class={styles.configField}>
							<div class={styles.configLabel}>节点类型</div>
							<div class={styles.configValue}>{selectedNode.type}</div>
						</div>

						<div class={styles.configField}>
							<div class={styles.configLabel}>节点名称</div>
							<input
								type="text"
								value={selectedNode.data?.label || ''}
								onInput={(e) => {
									if (selectedNode.data) {
										workflowStore.updateNodeData(selectedNode.id, {
											label: (e.target as HTMLInputElement).value,
										})
									}
								}}
								class={styles.configInput}
							/>
						</div>
					</div>
				</div>
			)
		}
	},
})
