import { defineComponent, ref, computed } from 'vue'
import { NTabs, NTabPane, NUpload, NUploadDragger, NButton, NSpace, NText, NIcon, NCard, NDivider } from 'naive-ui'
import { CloudUploadOutline, DocumentOutline, DownloadOutline } from '@vicons/ionicons5'

import { $t } from '@locales/index'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { fileImportMonitor, downloadMonitorTemplate } from '@/api/monitor'

import type { UploadFileInfo } from 'naive-ui'
import type { SupportedFileType, FileUploadStatus } from '@/types/monitor'

/**
 * 导入监控弹窗组件
 * @description 提供文件导入和模板下载功能的弹窗界面
 */
export default defineComponent({
	name: 'ImportMonitorModal',
	setup(_, { emit }) {
		// 消息提示和错误处理
		const message = useMessage()
		const { handleError } = useError()

		// 当前激活的标签页
		const activeTab = ref<'import' | 'template'>('import')

		// 文件上传状态
		const uploadStatus = ref<FileUploadStatus>({
			uploading: false,
			progress: 0,
			success: false,
		})

		// 支持的文件格式
		const supportedFormats: SupportedFileType[] = ['txt', 'csv', 'json', 'xlsx']

		// 文件格式验证
		const validateFileType = (file: File): boolean => {
			const extension = file.name.split('.').pop()?.toLowerCase() as SupportedFileType
			return supportedFormats.includes(extension)
		}

		// 文件大小验证（限制为10MB）
		const validateFileSize = (file: File): boolean => {
			const maxSize = 10 * 1024 * 1024 // 10MB
			return file.size <= maxSize
		}

		/**
		 * 处理文件上传前的验证
		 */
		const handleBeforeUpload = (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }): boolean => {
			const file = data.file.file
			if (!file) return false

			// 验证文件类型
			if (!validateFileType(file)) {
				message.error($t('t_1_1752724147270'))
				return false
			}

			// 验证文件大小
			if (!validateFileSize(file)) {
				message.error($t('t_2_1752724144669'))
				return false
			}

			return true
		}

		/**
		 * 处理文件上传
		 */
		const handleFileUpload = async (options: {
			file: UploadFileInfo
			onProgress: (e: { percent: number }) => void
		}) => {
			const file = options.file.file
			if (!file) return

			try {
				uploadStatus.value = {
					uploading: true,
					progress: 0,
					success: false,
				}

				// 模拟上传进度
				const progressInterval = setInterval(() => {
					if (uploadStatus.value.progress < 90) {
						uploadStatus.value.progress += 10
						options.onProgress({ percent: uploadStatus.value.progress })
					}
				}, 200)

				// 创建FormData并上传文件
				const formData = new FormData()
				formData.append('file', file)

				// 使用原生fetch进行文件上传，因为useApi可能不支持FormData
				const response = await fetch('/v1/monitor/file_add_monitor', {
					method: 'POST',
					body: formData,
				})

				if (!response.ok) {
					throw new Error(`上传失败: ${response.statusText}`)
				}

				const result = await response.json()

				clearInterval(progressInterval)

				uploadStatus.value = {
					uploading: false,
					progress: 100,
					success: true,
				}

				options.onProgress({ percent: 100 })

				// 显示上传结果
				if (result.data) {
					const { success_count, failed_count } = result.data
					message.success(
						$t('t_3_1752724148992')
							.replace('{success}', success_count.toString())
							.replace('{failed}', failed_count.toString()),
					)

					// 通知父组件刷新数据
					emit('success')
				} else {
					message.success($t('t_4_1752724142308'))
					emit('success')
				}
			} catch (error) {
				uploadStatus.value = {
					uploading: false,
					progress: 0,
					success: false,
					error: $t('t_39_1745227838696'),
				}
				handleError(error).default($t('t_5_1752724143078'))
			}
		}

		/**
		 * 下载模板文件
		 */
		const handleDownloadTemplate = async (type: SupportedFileType) => {
			try {
				// 使用原生fetch下载模板文件
				const response = await fetch(`/v1/monitor/template?type=${type}`, {
					method: 'GET',
				})

				if (!response.ok) {
					throw new Error(`下载模板失败: ${response.statusText}`)
				}

				const blob = await response.blob()

				// 根据文件类型设置正确的文件名
				const fileName = `monitor_template.${type}`

				// 创建下载链接
				const url = window.URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.href = url
				link.download = fileName
				link.style.display = 'none'
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				window.URL.revokeObjectURL(url)

				message.success(`${type.toUpperCase()} ${$t('t_6_1752724141819')}`)
			} catch (error) {
				handleError(error).default($t('t_7_1752724142049'))
			}
		}

		// 计算上传提示文本
		const uploadTipText = computed(() => {
			if (uploadStatus.value.uploading) {
				return `${$t('t_8_1752724140497')} ${uploadStatus.value.progress}%`
			}
			if (uploadStatus.value.success) {
				return $t('t_9_1752724142231')
			}
			if (uploadStatus.value.error) {
				return uploadStatus.value.error
			}
			return $t('t_10_1752724143320')
		})

		return () => (
			<div class="import-monitor-modal">
				<NTabs value={activeTab.value} onUpdateValue={(value) => (activeTab.value = value as 'import' | 'template')}>
					{/* 文件导入标签页 */}
					<NTabPane name="import" tab={$t('t_11_1752724141334')}>
						<div class="p-6">
							<NCard title={$t('t_12_1752724142422')} class="mb-4">
								<NUpload
									multiple={false}
									accept=".txt,.csv,.json,.xlsx"
									showFileList={false}
									onBeforeUpload={handleBeforeUpload}
									customRequest={handleFileUpload}
								>
									<NUploadDragger class="min-h-[200px]">
										<div class="text-center">
											<NIcon size={48} class="text-primary mb-4">
												<CloudUploadOutline />
											</NIcon>
											<NText class="text-lg block mb-2">{uploadTipText.value}</NText>
											<NText depth="3" class="text-sm">
												{$t('t_13_1752724148548')}
											</NText>
										</div>
									</NUploadDragger>
								</NUpload>
							</NCard>

							<NDivider />

							<NCard title={$t('t_14_1752724142256')} class="mt-4">
								<div class="space-y-3">
									<div>
										<NText strong>CSV格式：</NText>
										<NText depth="3" class="ml-2">
											监控名称,域名,协议,端口
										</NText>
									</div>
									<div>
										<NText strong>JSON格式：</NText>
										<NText depth="3" class="ml-2">{`[{"name":"","domain":"","protocol":"","port":""}]`}</NText>
									</div>
									<div>
										<NText strong>Excel格式：</NText>
										<NText depth="3" class="ml-2">
											第一行为标题，后续行为数据
										</NText>
									</div>
								</div>
							</NCard>
						</div>
					</NTabPane>

					{/* 模板下载标签页 */}
					<NTabPane name="template" tab={$t('t_15_1752724141047')}>
						<div class="p-6">
							<NCard title={$t('t_16_1752724141914')}>
								<NText class="block mb-6" depth="3">
									{$t('t_17_1752724150341')}
								</NText>

								<NSpace vertical size="large">
									{supportedFormats.map((format) => (
										<div key={format} class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
											<div class="flex items-center">
												<NIcon size={24} class="mr-3 text-primary">
													<DocumentOutline />
												</NIcon>
												<div>
													<NText strong class="block">
														{format.toUpperCase()} 模板
													</NText>
													<NText depth="3" class="text-sm">
														适用于 {format === 'xlsx' ? 'Excel' : format.toUpperCase()} 格式导入
													</NText>
												</div>
											</div>
											<NButton
												type="primary"
												size="small"
												onClick={() => handleDownloadTemplate(format)}
												v-slots={{
													icon: () => (
														<NIcon>
															<DownloadOutline />
														</NIcon>
													),
												}}
											>
												下载
											</NButton>
										</div>
									))}
								</NSpace>
							</NCard>
						</div>
					</NTabPane>
				</NTabs>
			</div>
		)
	},
})
