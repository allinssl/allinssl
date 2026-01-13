import { defineComponent, ref } from 'vue'
import { useWorkflowStore } from '../../store/workflow'
import { NotifyNodeData } from '../../types'
import configStyles from './Config.module.css'

export default defineComponent({
	name: 'NotifyNodeConfig',
	props: {
		nodeId: {
			type: String,
			required: true,
		},
		nodeData: {
			type: Object as () => NotifyNodeData,
			required: true,
		},
	},
	setup(props) {
		const workflowStore = useWorkflowStore()
		const message = ref(props.nodeData.message || '')
		const notifyType = ref(props.nodeData.notifyType || 'email')

		// 更新节点标签
		const updateNodeLabel = (value: string) => {
			workflowStore.updateNodeData(props.nodeId, { label: value })
		}

		// 更新通知消息
		const updateMessage = (value: string) => {
			message.value = value
			workflowStore.updateNodeData(props.nodeId, { message: value })
		}

		// 更新通知类型
		const updateNotifyType = (value: string) => {
			notifyType.value = value
			workflowStore.updateNodeData(props.nodeId, { notifyType: value })
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
					<div class={configStyles.configLabel}>通知类型</div>
					<select
						value={notifyType.value}
						onChange={(e) => updateNotifyType((e.target as HTMLSelectElement).value)}
						class={configStyles.configSelect}
					>
						<option value="email">邮件通知</option>
						<option value="sms">短信通知</option>
						<option value="wechat">微信通知</option>
						<option value="dingding">钉钉通知</option>
					</select>
				</div>

				<div class={configStyles.configField}>
					<div class={configStyles.configLabel}>通知内容</div>
					<textarea
						value={message.value}
						onInput={(e) => updateMessage((e.target as HTMLTextAreaElement).value)}
						class={configStyles.configTextarea}
						placeholder="请输入通知内容"
					></textarea>
				</div>

				<div class={configStyles.configInfo}>
					<div class={configStyles.configInfoTitle}>节点说明</div>
					<div class={configStyles.configInfoContent}>
						通知节点具备两个子节点，一个为成功节点，一个为失败节点，成功节点和失败节点各具备一个出口。
					</div>
				</div>
			</div>
		)
	},
})
