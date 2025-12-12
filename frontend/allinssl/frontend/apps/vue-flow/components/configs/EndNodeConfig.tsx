import { defineComponent } from 'vue'
import { useWorkflowStore } from '../../store/workflow'
import { EndNodeData } from '../../types'
import configStyles from './Config.module.css'

export default defineComponent({
	name: 'EndNodeConfig',
	props: {
		nodeId: {
			type: String,
			required: true,
		},
		nodeData: {
			type: Object as () => EndNodeData,
			required: true,
		},
	},
	setup(props) {
		const workflowStore = useWorkflowStore()

		const updateNodeLabel = (value: string) => {
			workflowStore.updateNodeData(props.nodeId, { label: value })
		}

		return () => (
			<div class={configStyles.configContainer}>
				<div class={configStyles.configField}>
					<div class={configStyles.configLabel}>节点名称</div>
					<input
						type="text"
						value={props.nodeData.label}
						onInput={(e) => updateNodeLabel((e.target as HTMLInputElement).value)}
						class={configStyles.configInput}
					/>
				</div>
				<div class={configStyles.configInfo}>
					<div class={configStyles.configInfoTitle}>节点说明</div>
					<div class={configStyles.configInfoContent}>
						结束节点作为工作流的终点，不可移动，不可删除，不可更改节点类型，只能有一个入口。
					</div>
				</div>
			</div>
		)
	},
})
