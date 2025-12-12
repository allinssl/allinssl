import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 工作流列表
export const getWorkflowList = Mock.mock(/\/workflow\/get_list/, 'post', () => {
	const list = []
	for (let i = 0; i < 10; i++) {
		list.push({
			id: Mock.Random.id(),
			name: `${Mock.Random.ctitle(3, 8)}部署流水线`,
			type: Mock.Random.pick(['auto', 'manual']),
			status: Mock.Random.integer(0, 1),
			created_at: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
			updated_at: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
		})
	}
	return {
		code: 0,
		count: list.length,
		data: {
			list,
			total: 28,
		},
		message: '获取成功',
		status: true,
	}
})

// 新增工作流
export const addWorkflow = Mock.mock(/\/workflow\/add_workflow/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '添加成功',
	status: true,
}))

// 修改工作流
export const updateWorkflow = Mock.mock(/\/workflow\/upd_workflow/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '修改成功',
	status: true,
}))

// 删除工作流
export const deleteWorkflow = Mock.mock(/\/workflow\/del_workflow/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '删除成功',
	status: true,
}))

// 获取工作流执行历史
export const getWorkflowHistory = Mock.mock(/\/workflow\/get_workflow_history/, 'post', () => {
	const list = []
	for (let i = 0; i < 10; i++) {
		list.push({
			id: Mock.Random.id(),
			workflow_id: Mock.Random.id(),
			workflow_name: `${Mock.Random.ctitle(3, 8)}部署流水线`,
			state: Mock.Random.integer(-1, 1),
			mode: Mock.Random.pick(['定时触发', '手动触发']),
			exec_time: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
		})
	}
	return {
		code: 0,
		count: list.length,
		data: list,
		message: '获取成功',
		status: true,
	}
})

// 手动执行工作流
export const executeWorkflow = Mock.mock(/\/workflow\/execute_workflow/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '执行成功',
	status: true,
}))

