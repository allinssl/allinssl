import { AxiosResponseData } from './public'

/** 站点监控列表请求参数 */
export interface SiteMonitorListParams {
	p?: number
	limit?: number
	search?: string
}

/** 站点监控项 */
export interface SiteMonitorItem {
	active: number // Monitor active status (1 = active, 0 = inactive)
	advance_day: number // Days in advance for notification
	ca: string // Certificate Authority (e.g., "sslTrus")
	common_name: string // Certificate common name (e.g., "*.bt.cn")
	create_time: string // Creation timestamp (YYYY-MM-DD HH:mm:ss)
	cycle: number // Monitoring cycle
	days_left: number // Days remaining until expiration
	except_end_time: string // Expected end time (YYYY-MM-DD HH:mm:ss)
	id: number // Unique identifier
	last_time: string // Last check time (YYYY-MM-DD HH:mm:ss)
	monitor_type: string // Type of monitoring (e.g., "https")
	name: string // Monitor name
	not_after: string // Certificate valid until (YYYY-MM-DD HH:mm:ss)
	not_before: string // Certificate valid from (YYYY-MM-DD HH:mm:ss)
	repeat_send_gap: number | null // Gap between repeat notifications
	report_types: string | string[] // Notification types (e.g., "dingtalk" or ["dingtalk", "mail"])
	sans: string // Subject Alternative Names
	target: string // Monitoring target URL/domain
	update_time: string // Last update time (YYYY-MM-DD HH:mm:ss)
	valid: number // Certificate validity status (1 = valid, 0 = invalid)
}

/** 站点监控列表响应 */
export interface SiteMonitorListResponse extends AxiosResponseData {
	data: SiteMonitorItem[]
}

/** 新增站点监控请求参数 */
export interface AddSiteMonitorParams {
	name: string
	target: string
	monitor_type: string // 监控类型 (e.g., "https", "smtp")
	report_types: string | string[] // 支持单个或多个通知类型
	cycle: number
	repeat_send_gap: number // 重复发送间隔(次数)
	active: number // 启用状态 (1 = 启用, 0 = 禁用)
	advance_day: number // 提前天数
}

/** 修改站点监控请求参数 */
export interface UpdateSiteMonitorParams extends AddSiteMonitorParams {
	id: number
}
/** 删除站点监控请求参数 */
export interface DeleteSiteMonitorParams {
	id: number
}

/** 启用/禁用站点监控请求参数 */
export interface SetSiteMonitorParams {
	id: number
	active: number
}

/** 证书链节点信息 */
export interface CertChainNode {
	common_name: string // 通用名称
	subject: string // 主题信息
	issuer: string // 颁发者信息
	children?: CertChainNode[] // 子证书链节点
}

/** 监控详情信息 */
export interface MonitorDetailInfo {
	ca: string // 证书颁发机构
	cert_chain: CertChainNode // 证书链信息
	common_name: string // 通用名称
	days_left: number // 剩余天数
	err_count: number // 错误次数
	last_time: string // 上次检测时间 (YYYY-MM-DD HH:mm:ss)
	monitor_type: string // 监控类型
	name: string // 监控名称
	not_after: string // 证书到期时间
	not_before: string // 证书生效时间
	sans: string // 主题备用名称
	target: string // 监控目标
	tls_version?: string // 支持的TLS版本（可选字段）
	valid: number // 验证状态 (1=有效, 0=无效)
	verify_error: string // 验证错误信息
}

/** 获取监控详情请求参数 */
export interface GetMonitorDetailParams {
	id: number
}

/** 获取监控详情响应 */
export interface GetMonitorDetailResponse extends AxiosResponseData {
	data: MonitorDetailInfo
}

/** 错误记录项 */
export interface ErrorRecord {
	create_time: string // 创建时间 (YYYY-MM-DD HH:mm:ss)
	id: number // 记录ID
	info: string // 附加信息
	monitor_id: number // 监控ID
	msg: string // 错误消息内容
}

/** 获取错误记录请求参数 */
export interface GetErrorRecordParams {
	id: number // 监控ID
	p: number // 页码
	limit: number // 每页条数
}

/** 获取错误记录响应 */
export interface GetErrorRecordResponse extends AxiosResponseData {
	count: number // 总记录数
	data: ErrorRecord[] // 错误记录数组
}

/** 文件导入监控请求参数 */
export interface FileImportMonitorParams {
	file: File // 上传的文件
}

/** 文件导入监控响应 */
export interface FileImportMonitorResponse extends AxiosResponseData {
	data: {
		success_count: number // 成功导入数量
		failed_count: number // 失败导入数量
		failed_items?: string[] // 失败的项目列表（可选）
	}
}

/** 模板下载请求参数 */
export interface TemplateDownloadParams {
	type: 'txt' | 'csv' | 'json' | 'xlsx' // 模板类型
}

/** 支持的文件格式类型 */
export type SupportedFileType = 'txt' | 'csv' | 'json' | 'xlsx'

/** 文件上传状态 */
export interface FileUploadStatus {
	uploading: boolean
	progress: number
	error?: string
	success?: boolean
}
