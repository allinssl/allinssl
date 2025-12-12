import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 获取首页概览
export const getOverviews = Mock.mock(/\/overview\/get_overviews/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		workfolw: {
			count: Mock.Random.integer(150, 250),
			active: Mock.Random.integer(120, 200),
			failure: Mock.Random.integer(0, 10),
		},
		cert: {
			count: Mock.Random.integer(30, 80),
			will: Mock.Random.integer(5, 15),
			end: Mock.Random.integer(0, 5),
		},
		site_monitor: {
			count: Mock.Random.integer(80, 150),
			exception: Mock.Random.integer(0, 8),
		},
		workflow_history: [
			{
				name: '服务A部署流水线',
				state: Mock.Random.integer(-1, 1),
				mode: Mock.Random.pick(['定时触发', '手动触发']),
				exec_time: Mock.Random.datetime('yyyy-MM-dd HH:mm'),
			},
			{
				name: '1panel 面板证书部署流水线',
				state: Mock.Random.integer(-1, 1),
				mode: Mock.Random.pick(['定时触发', '手动触发']),
				exec_time: Mock.Random.datetime('yyyy-MM-dd HH:mm'),
			},
			{
				name: '网站证书申请流水线',
				state: Mock.Random.integer(-1, 1),
				mode: Mock.Random.pick(['定时触发', '手动触发']),
				exec_time: Mock.Random.datetime('yyyy-MM-dd HH:mm'),
			},
			{
				name: '网站证书申请流水线',
				state: Mock.Random.integer(-1, 1),
				mode: Mock.Random.pick(['定时触发', '手动触发']),
				exec_time: Mock.Random.datetime('yyyy-MM-dd HH:mm'),
			},
			{
				name: '网站证书申请流水线',
				state: Mock.Random.integer(-1, 1),
				mode: Mock.Random.pick(['定时触发', '手动触发']),
				exec_time: Mock.Random.datetime('yyyy-MM-dd HH:mm'),
			},
		],
	},
	message: '获取成功',
	status: true,
}))
