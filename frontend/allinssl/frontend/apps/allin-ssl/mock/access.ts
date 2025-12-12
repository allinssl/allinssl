import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 授权列表
export const getAccessList = Mock.mock(/\/access\/get_list/, 'post', () => {
	const list = []
	for (let i = 0; i < 10; i++) {
		list.push({
			id: Mock.Random.id(),
			name: `授权-${Mock.Random.ctitle(3, 5)}`,
			type: Mock.Random.pick(['ssh', 'btpanel', '1panel', 'aliyun', 'tencent']),
			status: Mock.Random.integer(0, 1),
			created_at: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
		})
	}
	return {
		code: 0,
		count: list.length,
		data: {
			list,
			total: 18,
		},
		message: '获取成功',
		status: true,
	}
})

// 授权类型列表
export const getAccessTypes = Mock.mock(/\/access\/get_access_types/, 'post', () => ({
	code: 0,
	count: 3,
	data: [
		{ key: 'ssh', name: 'SSH验证' },
		{ key: 'btpanel', name: '宝塔验证' },
		{ key: '1panel', name: '1Panel验证' },
		{ key: 'aliyun', name: '阿里云验证' },
		{ key: 'tencentcloud', name: '腾讯云验证' },
	],
	message: '获取成功',
	status: true,
}))

// 新增授权
export const addAccess = Mock.mock(/\/access\/add_access/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '添加成功',
	status: true,
}))

// 修改授权
export const updateAccess = Mock.mock(/\/access\/upd_access/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '修改成功',
	status: true,
}))

// 删除授权
export const deleteAccess = Mock.mock(/\/access\/del_access/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '删除成功',
	status: true,
}))

// 获取工作流 dns 配置

export const getAccessAllList = Mock.mock(/\/access\/get_all/, 'post', () => {
	const list: Array<{ id: string; name: string; type: string }> = []
	for (let i = 0; i < 3; i++) {
		const group = Mock.Random.pick([
			{ name: '阿里云', type: 'aliyun' },
			{ name: '腾讯云', type: 'tencentcloud' },
		])
		list.push({
			id: Mock.Random.id(),
			name: `${group.name} DNS 配置`,
			type: group.type,
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
