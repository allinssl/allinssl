import { defineComponent, ref } from 'vue'
import { useWorkflowStore } from '../../store/workflow'
import { ApplyNodeData } from '../../types'
import configStyles from './Config.module.css'

export default defineComponent({
	name: 'ApplyNodeConfig',
	props: {
		nodeId: {
			type: String,
			required: true,
		},
		nodeData: {
			type: Object as () => ApplyNodeData,
			required: true,
		},
	},
	setup(props) {
		const workflowStore = useWorkflowStore()
		const applicationContent = ref(props.nodeData.applicationContent || '')
		const applyStatus = ref<'idle' | 'applying' | 'success' | 'error'>('idle')
		const errorMessage = ref('')

		// 更新节点标签
		const updateNodeLabel = (value: string) => {
			workflowStore.updateNodeData(props.nodeId, { label: value })
		}

		// 更新申请内容
		const updateApplicationContent = (value: string) => {
			applicationContent.value = value
		}

		// 提交申请
		const submitApplication = () => {
			if (!applicationContent.value.trim()) {
				errorMessage.value = '请输入申请内容'
				return
			}

			// 模拟申请过程
			applyStatus.value = 'applying'
			errorMessage.value = ''

			setTimeout(() => {
				applyStatus.value = 'success'
				workflowStore.updateNodeData(props.nodeId, {
					applicationContent: applicationContent.value,
				})
			}, 1000)
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
					<div class={configStyles.configLabel}>申请内容</div>
					<textarea
						value={applicationContent.value}
						onInput={(e) => updateApplicationContent((e.target as HTMLTextAreaElement).value)}
						class={configStyles.configTextarea}
						placeholder="请输入申请内容"
					></textarea>
				</div>

				{errorMessage.value && <div class={configStyles.configError}>{errorMessage.value}</div>}

				<div class={configStyles.configActions}>
					<button
						class={configStyles.configButton}
						onClick={submitApplication}
						disabled={applyStatus.value === 'applying'}
					>
						{applyStatus.value === 'applying' ? '申请中...' : '提交申请'}
					</button>

					{applyStatus.value === 'success' && <div class={configStyles.configSuccess}>申请提交成功</div>}
				</div>

				<div class={configStyles.configInfo}>
					<div class={configStyles.configInfoTitle}>节点说明</div>
					<div class={configStyles.configInfoContent}>申请节点用于提交申请。申请成功后，申请内容将保存到节点中。</div>
				</div>
			</div>
		)
	},
})
