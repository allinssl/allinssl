/**
 * 域名安全页面类型定义
 */

/** API密钥项 */
export interface ApiKeyItem {
	/** 密钥ID */
	id: number
	/** 密钥名称 */
	name: string
	/** Access Key */
	access_key: string
	/** Secret Key */
	secret_key: string
	/** Account ID */
	account_id: string
	/** 状态：0-禁用，1-启用 */
	status: 0 | 1
	/** 状态文本 */
	status_text?: string
	/** 最后调用时间 - 字符串格式 */
	last_used_at?: string | null
	/** 最后调用IP */
	last_used_ip?: string
	/** IP白名单 */
	ip_whitelist?: string[]
	/** 创建时间（字符串格式） */
	created_at: string
	/** 更新时间（字符串格式） */
	updated_at: string
	/** UID */
	uid?: number
}

/** API密钥列表请求参数 */
export interface ApiKeyListRequest {
	/** 页码，从 1 开始 */
	p?: number
	/** 每页条数 */
	rows?: number
	/** 关键字搜索 */
	keyword?: string
	/** 状态过滤：不传-全部，0-禁用，1-启用 */
	status?: number | string
}

/** 状态选项 */
export interface StatusOption {
	label: string
	value: number | string
}

/** API密钥创建/更新请求 */
export interface ApiKeyFormData {
	/** 密钥名称 */
	name: string
	/** IP白名单（可选） */
	ip_whitelist?: string
	/** 状态 */
	status: 0 | 1
}

