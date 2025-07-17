import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 站点监控列表
export const getSiteMonitorList = Mock.mock(/\/siteMonitor\/get_list/, 'post', () => {
	const list = []
	for (let i = 0; i < 12; i++) {
		list.push({
			id: Mock.Random.id(),
			name: `${Mock.Random.ctitle(2, 5)}网站监控`,
			url: `https://${Mock.Random.domain()}/api/${Mock.Random.word(3, 8)}`,
			type: Mock.Random.pick(['HTTP', 'HTTPS', 'TCP', 'PING']),
			status: Mock.Random.integer(0, 1),
			check_result: Mock.Random.pick(['连接成功', '超时', '证书有效', '证书已过期']),
			created_at: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
		})
	}
	return {
		code: 0,
		count: list.length,
		data: {
			list,
			total: 25,
		},
		message: '获取成功',
		status: true,
	}
})

// 新增站点监控
export const addSiteMonitor = Mock.mock(/\/siteMonitor\/add_site_monitor/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '添加成功',
	status: true,
}))

// 修改站点监控
export const updateSiteMonitor = Mock.mock(/\/siteMonitor\/upd_site_monitor/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '修改成功',
	status: true,
}))

// 删除站点监控
export const deleteSiteMonitor = Mock.mock(/\/monitor\/del_monitor/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '删除成功',
	status: true,
}))

// 启用/禁用站点监控
export const setSiteMonitor = Mock.mock(/\/siteMonitor\/set_site_monitor/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '设置成功',
	status: true,
}))
