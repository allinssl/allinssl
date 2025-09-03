import { defineComponent, ref } from 'vue'
import { useWorkflowStore } from '../../store/workflow'
import { NormalNodeData } from '../../types'
import configStyles from './Config.module.css'

export default defineComponent({
	name: 'NormalNodeConfig',
	props: {
		nodeId: {
			type: String,
			required: true,
		},
		nodeData: {
			type: Object as () => NormalNodeData,
			required: true,
		},
	},
	setup(props) {
		const workflowStore = useWorkflowStore()
		const message = ref(props.nodeData.message || '')
		const status = ref(props.nodeData.status || 'info')

		// 更新节点标签
		const updateNodeLabel = (value: string) => {
			workflowStore.updateNodeData(props.nodeId, { label: value })
		}

		// 更新消息内容
		const updateMessage = (value: string) => {
			message.value = value
			workflowStore.updateNodeData(props.nodeId, { message: value })
		}

		// 更新状态
		const updateStatus = (value: string) => {
			status.value = value as 'success' | 'error' | 'info'
			workflowStore.updateNodeData(props.nodeId, { status: value as 'success' | 'error' | 'info' })
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

				<div class={configStyles.configField}>
					<div class={configStyles.configLabel}>状态</div>
					<select
						value={status.value}
						onChange={(e) => updateStatus((e.target as HTMLSelectElement).value)}
						class={configStyles.configSelect}
					>
						<option value="info">信息</option>
						<option value="success">成功</option>
						<option value="error">失败</option>
					</select>
				</div>

				<div class={configStyles.configField}>
					<div class={configStyles.configLabel}>消息内容</div>
					<textarea
						value={message.value}
						onInput={(e) => updateMessage((e.target as HTMLTextAreaElement).value)}
						class={configStyles.configTextarea}
						placeholder="请输入消息内容"
					></textarea>
				</div>

				<div class={configStyles.configInfo}>
					<div class={configStyles.configInfoTitle}>节点说明</div>
					<div class={configStyles.configInfoContent}>普通节点用于显示文本或者成功/失败提示。</div>
				</div>
			</div>
		)
	},
})
