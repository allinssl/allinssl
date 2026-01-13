import { defineComponent, ref } from 'vue'
import { useWorkflowStore } from '../../store/workflow'
import { UploadNodeData } from '../../types'
import configStyles from './Config.module.css'

export default defineComponent({
	name: 'UploadNodeConfig',
	props: {
		nodeId: {
			type: String,
			required: true,
		},
		nodeData: {
			type: Object as () => UploadNodeData,
			required: true,
		},
	},
	setup(props) {
		const workflowStore = useWorkflowStore()
		const certificateContent = ref(props.nodeData.certificateContent || '')
		const uploadStatus = ref<'idle' | 'uploading' | 'success' | 'error'>('idle')
		const errorMessage = ref('')

		// 更新节点标签
		const updateNodeLabel = (value: string) => {
			workflowStore.updateNodeData(props.nodeId, { label: value })
		}

		// 更新证书内容
		const updateCertificateContent = (value: string) => {
			certificateContent.value = value
		}

		// 上传证书
		const uploadCertificate = () => {
			if (!certificateContent.value.trim()) {
				errorMessage.value = '请输入证书内容'
				return
			}

			// 模拟上传过程
			uploadStatus.value = 'uploading'
			errorMessage.value = ''

			setTimeout(() => {
				uploadStatus.value = 'success'
				workflowStore.updateNodeData(props.nodeId, {
					certificateContent: certificateContent.value,
				})
			}, 1000)
		}

		// 处理文件上传
		const handleFileUpload = (event: Event) => {
			const fileInput = event.target as HTMLInputElement
			const file = fileInput.files?.[0]

			if (file) {
				const reader = new FileReader()
				reader.onload = (e) => {
					const content = e.target?.result as string
					certificateContent.value = content
				}
				reader.readAsText(file)
			}
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
					<div class={configStyles.configLabel}>上传证书文件</div>
					<input
						type="file"
						class={configStyles.configFileInput}
						onChange={handleFileUpload}
						accept=".pem,.crt,.key,.cert"
					/>
				</div>

				<div class={configStyles.configField}>
					<div class={configStyles.configLabel}>或粘贴证书内容</div>
					<textarea
						value={certificateContent.value}
						onInput={(e) => updateCertificateContent((e.target as HTMLTextAreaElement).value)}
						class={configStyles.configTextarea}
						placeholder="请粘贴证书内容"
					></textarea>
				</div>

				{errorMessage.value && <div class={configStyles.configError}>{errorMessage.value}</div>}

				<div class={configStyles.configActions}>
					<button
						class={configStyles.configButton}
						onClick={uploadCertificate}
						disabled={uploadStatus.value === 'uploading'}
					>
						{uploadStatus.value === 'uploading' ? '上传中...' : '上传证书'}
					</button>

					{uploadStatus.value === 'success' && <div class={configStyles.configSuccess}>上传成功</div>}
				</div>

				<div class={configStyles.configInfo}>
					<div class={configStyles.configInfoTitle}>节点说明</div>
					<div class={configStyles.configInfoContent}>
						上传证书节点用于上传证书文件或粘贴证书内容。上传成功后，证书内容将保存到节点中。
					</div>
				</div>
			</div>
		)
	},
})
