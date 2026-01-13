import { defineComponent } from 'vue'
import { NButton, NCard, NSwitch } from 'naive-ui'
import useTable from '@hooks/useTable'

// 定义表格数据接口
interface TableData {
	id: number
	cpu: number
	memory: number
	disk: number
	netIn: string
	netOut: string
	status: boolean
	updateTime: string
}

// 生成随机数据的辅助函数
const generateRandomData = (count: number): TableData[] => {
	return Array.from({ length: count }, (_, index) => ({
		id: index + 1,
		cpu: Math.floor(Math.random() * 100),
		memory: Math.floor(Math.random() * 100),
		disk: Math.floor(Math.random() * 100),
		netIn: `${(Math.random() * 100).toFixed(2)} MB/s`,
		netOut: `${(Math.random() * 100).toFixed(2)} MB/s`,
		status: Math.random() > 0.5,
		updateTime: new Date().toLocaleString(),
	}))
}

// 模拟API请求
const mockTableRequest = async (params: any) => {
	const { page = 1, pageSize = 10 } = params
	await new Promise((resolve) => setTimeout(resolve, 1000))
	const total = 100
	const list = generateRandomData(pageSize)
	return {
		list,
		total,
	}
}

export default defineComponent({
	name: 'TableDemo',
	setup() {
		const { TableComponent } = useTable<TableData>({
			columns: [
				{ title: 'ID', key: 'id', width: 80 },
				{ title: 'CPU使用率', key: 'cpu', width: 120 },
				{ title: '内存使用率', key: 'memory', width: 120 },
				{ title: '磁盘使用率', key: 'disk', width: 120 },
				{ title: '网络流入', key: 'netIn', width: 120 },
				{ title: '网络流出', key: 'netOut', width: 120 },
				{
					title: '状态',
					key: 'status',
					width: 100,
					render: (row) => {
						return <NSwitch size="small" value={row.status} />
					},
				},
				{ title: '更新时间', key: 'updateTime', width: 160 },
				{
					title: '操作',
					key: 'action',
					width: 100,
					fixed: 'right',
					align: 'right',
					render: (row) => {
						return (
							<NButton type="text" size="small">
								编辑
							</NButton>
						)
					},
				},
			],
			requestFn: mockTableRequest,
		})

		return () => (
			<NCard title="表格示例" class="mt-[16px]">
				<TableComponent />
			</NCard>
		)
	},
})
