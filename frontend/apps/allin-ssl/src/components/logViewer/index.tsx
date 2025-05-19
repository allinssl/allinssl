import { NCard, NSpin, NButton, NSpace, NIcon, NLog, NConfigProvider } from 'naive-ui'
import hljs from 'highlight.js/lib/core'
import { $t } from '@locales/index'
import { DownloadOutline, RefreshOutline } from '@vicons/ionicons5'
import { useThemeCssVar } from '@baota/naive-ui/theme'

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
		const logRef = ref<any>(null)

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
		hljs.registerLanguage('custom-logs', () => ({
			contains: [
				{
					className: 'info-text',
					begin: /\[INFO\]/,
				},
				{
					className: 'error-text',
					begin: /\[ERROR\]/,
				},
				{
					className: 'warning-text',
					begin: /\[WARNING\]/,
				},
				{
					className: 'date-text',
					begin: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
				},
			],
		}))

		const cssVar = useThemeCssVar(['successColor', 'errorColor', 'warningColor', 'successColorPressed'])

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
			nextTick(() => {
				logRef.value?.scrollTo({ top: Number.MAX_SAFE_INTEGER })
			})
		}

		// 刷新日志
		const refreshLogs = () => {
			loadLogs()
		}

		type LogLine = { type: string; content: string }

		// 将日志内容转换为NLog需要的格式
		const logContent = computed((): LogLine[] => {
			if (!logs.value) return []
			return logs.value.split('\n').map(
				(line): LogLine => ({
					type: 'default',
					content: line,
				}),
			)
		})

		onMounted(() => {
			// 如果有传入获取日志的方法，则调用
			loadLogs()
		})

		return () => (
			<NCard bordered={false} class="w-full h-full" contentClass="!p-3" style={cssVar.value}>
				<div class="mb-2.5 flex justify-start items-center">
					<NSpace>
						<NButton onClick={refreshLogs} size="small" type="primary">
							<NIcon class="mr-1">
								<RefreshOutline />
							</NIcon>
							{$t('t_0_1746497662220')}
						</NButton>
						{props.enableDownload && (
							<NButton onClick={downloadLogs} size="small">
								<NIcon class="mr-1">
									<DownloadOutline />
								</NIcon>
								{$t('t_2_1746776194263')}
							</NButton>
						)}
					</NSpace>
				</div>

				<NSpin show={isLoading.value}>
					<NConfigProvider hljs={hljs}>
						<NLog
							ref={logRef}
							log={logs.value}
							rows={logContent.value.length}
							language="custom-logs"
							loading={isLoading.value}
							fontSize={14}
							trim={false}
							lineHeight={1.5}
							style={{
								height: '500px',
								border: '1px solid var(--n-border-color)',
								padding: '10px',
								borderRadius: '10px',
							}}
						/>
					</NConfigProvider>
				</NSpin>
			</NCard>
		)
	},
})
