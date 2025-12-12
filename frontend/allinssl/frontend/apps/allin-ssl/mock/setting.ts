import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 获取系统设置
export const getSystemSetting = Mock.mock(/\/setting\/get_setting/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		auto_renew: true,
		renew_days: 30,
		notify_enable: true,
		notify_days: 15,
	},
	message: '获取成功',
	status: true,
}))

// 保存系统设置
export const saveSystemSetting = Mock.mock(/\/setting\/save_setting/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '保存成功',
	status: true,
}))

// 获取告警类型列表
export const getReportTypes = Mock.mock(/\/setting\/get_report_types/, 'post', () => ({
	code: 0,
	count: 4,
	data: [
		{ key: 'email', name: '邮件通知' },
		{ key: 'sms', name: '短信通知' },
		{ key: 'webhook', name: 'Webhook' },
		{ key: 'dingtalk', name: '钉钉通知' },
	],
	message: '获取成功',
	status: true,
}))

// 配置告警
export const setReport = Mock.mock(/\/setting\/set_report/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '配置成功',
	status: true,
}))

// 删除告警
export const deleteReport = Mock.mock(/\/setting\/del_report/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '删除成功',
	status: true,
}))

// 获取证书过期通知模板
export const getCertEndNoticeTemplate = Mock.mock(/\/setting\/get_certend_notice_temp/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		title: '证书即将过期通知',
		content: '您的证书 {{domain}} 将在 {{days}} 天后过期，请及时更新。',
	},
	message: '获取成功',
	status: true,
}))

// 保存证书过期通知模板
export const saveCertEndNoticeTemplate = Mock.mock(/\/setting\/save_certend_notice_temp/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '保存成功',
	status: true,
}))

// 系统更新
export const systemUpdate = Mock.mock(/\/setting\/update/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '更新成功',
	status: true,
}))
