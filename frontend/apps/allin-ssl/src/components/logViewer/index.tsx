import { NCard, NText, NSpin, NScrollbar, NButton, NSpace, NIcon } from 'naive-ui'
import { $t } from '@locales/index'
import { DownloadOutline } from '@vicons/ionicons5'

export default defineComponent({
	name: 'LogViewer',
	props: {
		// 日志内容
		content: {
			type: String,
			default: '',
		},
		// 是否加载中
		loading: {
			type: Boolean,
			default: false,
		},
		// 是否允许下载
		enableDownload: {
			type: Boolean,
			default: true,
		},
		// 下载文件名
		downloadFileName: {
			type: String,
			default: 'logs.txt',
		},
		// 标题
		title: {
			type: String,
			default: $t('t_0_1746776194126'),
		},
		// 获取日志方法
		fetchLogs: {
			type: Function as PropType<() => Promise<string>>,
			default: () => Promise.resolve(''),
		},
	},
	setup(props) {
		const logs = ref(props.content || '')
		const isLoading = ref(props.loading)
		const logContainerRef = ref<HTMLDivElement | null>(null)

		// 监听内容变化
		watch(
			() => props.content,
			(newValue) => {
				logs.value = newValue
				scrollToBottom()
			},
		)

		// 监听加载状态变化
		watch(
			() => props.loading,
			(newValue) => {
				isLoading.value = newValue
			},
		)

		watch(
			() => props.fetchLogs,
			(newValue) => {
				console.log('fetchLogs', props.fetchLogs)
			},
		)

		onMounted(() => {
			// 如果有传入获取日志的方法，则调用
			// 这里可以根据需要设置一个定时器来定时获取日志
			loadLogs()
			scrollToBottom()
		})

		// 加载日志
		const loadLogs = async () => {
			if (!props.fetchLogs) return
			isLoading.value = true
			try {
				const result = await props.fetchLogs()
				logs.value = result
				scrollToBottom()
			} catch (error) {
				console.error($t('t_1_1746776198156'), error)
			} finally {
				isLoading.value = false
			}
		}

		// 下载日志
		const downloadLogs = () => {
			if (!logs.value) return
			const blob = new Blob([logs.value], { type: 'text/plain' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = props.downloadFileName
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		}

		// 滚动到底部
		const scrollToBottom = () => {
			setTimeout(() => {
				if (logContainerRef.value) {
					const scrollElement = logContainerRef.value.querySelector('.n-scrollbar-container')
					if (scrollElement) {
						scrollElement.scrollTop = scrollElement.scrollHeight
					}
				}
			}, 100)
		}

		// 刷新日志
		const refreshLogs = () => {
			loadLogs()
		}

		return () => (
			<NCard bordered={false} class="w-full h-full" contentClass="!p-0">
				<NSpin show={isLoading.value}>
					<div class="mb-2.5 flex justify-start items-center">
						<NSpace>
							<NButton onClick={refreshLogs} size="small">
								{$t('t_0_1746497662220')}
							</NButton>
							{props.enableDownload && (
								<NButton onClick={downloadLogs} size="small">
									<NIcon>
										<DownloadOutline />
									</NIcon>
									<span>{$t('t_2_1746776194263')}</span>
								</NButton>
							)}
						</NSpace>
					</div>
					<div class="border border-gray-200 rounded bg-gray-50" ref={logContainerRef}>
						<NScrollbar class="h-max-[500px]">
							<NText class="block p-3 h-[500px] font-mono whitespace-pre-wrap break-all text-[1.2rem] leading-normal">
								{logs.value ? logs.value : $t('t_3_1746776195004')}
							</NText>
						</NScrollbar>
					</div>
				</NSpin>
			</NCard>
		)
	},
})
