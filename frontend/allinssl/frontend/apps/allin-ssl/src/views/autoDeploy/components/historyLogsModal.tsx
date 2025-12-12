import { getWorkflowHistoryDetail } from '@/api/workflow'
import LogViewer from '@components/LogDisplay'

export default defineComponent({
	name: 'HistoryLogsModal',
	props: {
		id: {
			type: [String] as PropType<string>,
			required: true,
		},
	},
	setup(props) {
		const loading = ref(false)
		const logContent = ref('')

		// 获取日志数据
		const fetchLogs = async () => {
			loading.value = true
			try {
				const { data } = await getWorkflowHistoryDetail({ id: props.id }).fetch()
				if (data) {
					logContent.value = data
				} else {
					logContent.value = '没有日志数据'
				}
				return logContent.value
			} catch (error) {
				console.error('获取日志详情失败:', error)
				return '获取日志失败: ' + (error instanceof Error ? error.message : String(error))
			} finally {
				loading.value = false
			}
		}

		return () => (
			<LogViewer
				title={`工作流执行日志 (ID: ${props.id})`}
				loading={loading.value}
				content={logContent.value}
				fetchLogs={fetchLogs}
			/>
		)
	},
})
