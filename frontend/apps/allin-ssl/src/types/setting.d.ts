import { AxiosResponseData } from './public'

/** 获取设置请求参数 */
export interface GetSettingParams {
	// 无参数
}

/** 系统设置 */
export interface SystemSetting {
	timeout: number // 超时时间
	secure: string // 协议
	https: 0 | 1 // 是否开启https
	key: string // 证书密钥
	cert: string // 证书
	username: string // 用户
	password: string // 密码
}

/** 获取设置响应 */
export interface GetSettingResponse extends AxiosResponseData {
	data: SystemSetting
}

/** 保存设置请求参数 */
export interface SaveSettingParams extends SystemSetting {
	// 无参数
}

/** 获取告警类型请求参数 */
export interface GetReportListParams {
	search: string
	p: number
	limit: number
}

/** 获取告警类型响应 */
export interface ReportType<T = string> {
	config: T
	create_time: string
	id: number
	name: string
	type: string
	update_time: string
}

/** 获取告警类型响应 */
export interface GetReportListResponse extends AxiosResponseData {
	data: ReportType[]
}

export interface ReportMail {
	name?: string
	enabled: string
	password: string
	receiver: string
	sender: string
	smtpHost: string
	smtpPort: string
	smtpTLS: true | false
	// username: string
}

/** 飞书通知配置 */
export interface ReportFeishu {
	name?: string
	enabled: string
	webhook: string
	secret: string
}

/** 钉钉通知配置 */
export interface ReportDingtalk {
	name?: string
	enabled: string
	webhook: string
	secret: string
}

/** Webhook通知配置 */
export interface ReportWebhook {
	name?: string
	enabled: string
	url: string
	data: string
	method: 'post' | 'get'
	headers: string
	ignore_ssl: boolean
}

/** 企业微信通知配置 */
export interface ReportWecom {
	name?: string
	enabled: string
	url: string
	data: string
}

/** 添加告警请求参数 */
export interface AddReportParams<T = string> {
	name: string
	type: string
	config: T
}

/** 系统更新请求参数 */
export interface UpdateReportParams extends AddReportParams {
	id: number
}

/** 系统更新请求参数 */
export interface DeleteReportParams {
	id: number
}

/** 测试告警请求参数 */
export interface TestReportParams {
	id: number
}

/** 获取版本信息请求参数 */
export interface GetVersionParams {
	// 无参数
}

/** 版本信息数据 */
export interface VersionData {
	date: string // 版本日期
	log: string // 更新日志
	new_version: string // 新版本号
	update: string // 是否有更新 "1" 表示有更新，"0" 表示无更新
	version: string // 当前版本号
}

/** 获取版本信息响应 */
export interface GetVersionResponse extends AxiosResponseData {
	data: VersionData
}

/** 消息通知选项 */
export interface NotifyProviderOption {
	label: string
	value: string
	type: string
}

/** DNS提供商选项 */
export interface DnsProviderOption {
	label: string
	value: string
	type: string
}

/** 通知渠道 */
export interface Channel {
	id: string
	type: string
	name: string
	sender?: string
	host?: string
	port?: number
	receiver?: string
}
