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
	/** 备注 */
	remark?: string
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
	/** 备注 */
	remark?: string
}

// ==================== 安全相关类型定义 ====================

/** 安全状态数据 */
export interface SecurityStatusData {
	/** 全局转移锁开关 */
	global_transfer_lock: boolean
	/** 密保问题状态 */
	has_security_questions: boolean
	/** 敏感操作限制开关 */
	operation_protection: boolean
	/** 手机号 */
	phone: string
	/** 手机验证状态 */
	phone_verified: boolean
	/** 当前密保问题 */
	questions?: string
}

/** 密保问题列表 */
export interface SecurityQuestionsListData {
	questions: Record<string, string>
}

/** 密保问题项 */
export interface SecurityQuestionItem {
	/** 问题ID */
	question_id: number
	/** 问题文本 */
	question_text: string
}

/** 密保问题答案 */
export interface SecurityQuestionAnswer {
	/** 问题ID */
	question_id: number
	/** 答案 */
	answer: string
	/** 确认答案 */
	confirm_answer?: string
}

/** 设置密保问题请求 */
export interface SetupSecurityQuestionsRequest {
	/** 密保问题数组 */
	questions: SecurityQuestionAnswer[]
}

/** 更新安全设置请求 */
export interface UpdateProtectionSettingsRequest {
	/** 域名转移保护开关 */
	domain_transfer_protection?: boolean
	/** DNS修改保护开关 */
	dns_modify_protection?: boolean
	/** 敏感操作保护开关 */
	operation_protection?: boolean
	/** 全局转移锁开关 */
	global_transfer_lock?: boolean
}

/** 验证密保问题请求 */
export interface VerifySecurityQuestionsRequest {
	/** 操作类型 */
	operation_type: string
	/** 密保问题答案数组 */
	answers: SecurityQuestionAnswer[]
}

/** 验证密保问题响应 */
export interface VerifySecurityQuestionsResponse {
	/** 过期时间（秒） */
	expires_in: number
	/** 消息 */
	message: string
	/** 操作类型 */
	operation_type: string
	/** 安全令牌 */
	security_token: string
}

/** 发送手机验证码请求 */
export interface SendPhoneCodeRequest {
	/** 手机号码 */
	phone: string
}

/** 验证手机号请求 */
export interface VerifyPhoneRequest {
	/** 手机号码 */
	phone: string
	/** 验证码 */
	code: string
}

/** 验证手机号响应 */
export interface VerifyPhoneResponse {
	/** 消息 */
	message: string
	/** 手机号 */
	phone: string
	/** 临时验证过期时间 */
	temp_expires_in: number
	/** 临时验证状态 */
	temp_verified: boolean
}

/** 域名安全标签页键值 */
export type DomainSecurityTabKey = 'api-management' | 'basic-security' | 'operation-protection' | 'global-transfer-lock' | 'panel-whitelist'

// ==================== 面板IP白名单相关类型定义 ====================

/** 面板IP白名单项 */
export interface PanelWhitelistItem {
	/** 白名单ID */
	id: number
	/** 白名单名称 */
	name: string
	/** 是否启用 */
	is_enabled: boolean
	/** IP白名单 */
	whitelist_ips: string[]
	/** 备注 */
	remark: string | null
	/** 创建时间（时间戳） */
	created_at: number
	/** 更新时间（时间戳） */
	updated_at: number
}

/** 面板IP白名单列表请求参数 */
export interface PanelWhitelistListRequest {
	/** 页码，从 1 开始 */
	p?: number
	/** 每页条数 */
	rows?: number
}

/** 面板IP白名单创建/更新请求 */
export interface PanelWhitelistFormData {
	/** 白名单名称 */
	name: string
	/** IP白名单 */
	whitelist_ips: string[]
	/** 是否启用 */
	is_enabled: boolean
	/** 备注 */
	remark?: string
}

/** 面板IP白名单表单数据（用于前端表单） */
export interface PanelWhitelistFormInputData {
	/** 白名单名称 */
	name: string
	/** IP白名单（字符串格式，每行一个IP） */
	whitelist_ips: string
	/** 是否启用 */
	is_enabled: boolean
	/** 备注 */
	remark?: string
}

/** 面板IP白名单切换状态请求 */
export interface PanelWhitelistToggleRequest {
	/** 白名单ID */
	id: number
	/** 白名单名称 */
	name: string
	/** IP白名单 */
	whitelist_ips: string[]
	/** 是否启用 */
	is_enabled: boolean
	/** 备注 */
	remark?: string
}

/** 面板IP白名单删除请求 */
export interface PanelWhitelistDeleteRequest {
	/** 白名单ID */
	id: number
}


