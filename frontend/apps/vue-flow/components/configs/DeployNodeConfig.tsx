import { defineComponent, ref } from 'vue'
import { useWorkflowStore } from '../../store/workflow'
import { DeployNodeData } from '../../types'
import configStyles from './Config.module.css'

export default defineComponent({
	name: 'DeployNodeConfig',
	props: {
		nodeId: {
			type: String,
			required: true,
		},
		nodeData: {
			type: Object as () => DeployNodeData,
			required: true,
		},
	},
	setup(props) {
		const workflowStore = useWorkflowStore()
		const certificateContent = ref(props.nodeData.certificateContent || '')
		const deployStatus = ref<'idle' | 'deploying' | 'success' | 'error'>('idle')
		const errorMessage = ref('')

		// 更新节点标签
		const updateNodeLabel = (value: string) => {
			workflowStore.updateNodeData(props.nodeId, { label: value })
		}

		// 更新证书内容
		const updateCertificateContent = (value: string) => {
			certificateContent.value = value
		}

		// 部署证书
		const deployCertificate = () => {
			if (!certificateContent.value.trim()) {
				errorMessage.value = '请输入证书内容'
				return
			}

			// 模拟部署过程
			deployStatus.value = 'deploying'
			errorMessage.value = ''

			setTimeout(() => {
				deployStatus.value = 'success'
				workflowStore.updateNodeData(props.nodeId, {
					certificateContent: certificateContent.value,
				})
			}, 1500)
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
					<div class={configStyles.configLabel}>证书内容</div>
					<textarea
						value={certificateContent.value}
						onInput={(e) => updateCertificateContent((e.target as HTMLTextAreaElement).value)}
						class={configStyles.configTextarea}
						placeholder="请输入要部署的证书内容"
					></textarea>
				</div>

				{errorMessage.value && <div class={configStyles.configError}>{errorMessage.value}</div>}

				<div class={configStyles.configActions}>
					<button
						class={configStyles.configButton}
						onClick={deployCertificate}
						disabled={deployStatus.value === 'deploying'}
					>
						{deployStatus.value === 'deploying' ? '部署中...' : '部署证书'}
					</button>

					{deployStatus.value === 'success' && <div class={configStyles.configSuccess}>部署成功</div>}
				</div>

				<div class={configStyles.configInfo}>
					<div class={configStyles.configInfoTitle}>节点说明</div>
					<div class={configStyles.configInfoContent}>
						部署证书节点用于部署证书。部署成功后，证书内容将保存到节点中。
					</div>
				</div>
			</div>
		)
	},
})
