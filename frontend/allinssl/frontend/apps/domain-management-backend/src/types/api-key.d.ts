/**
 * @fileoverview API密钥管理相关类型定义
 * @description 定义API密钥创建、查询、更新等操作的数据类型
 */

// API密钥创建请求参数
export interface CreateApiKeyRequest {
	/** 密钥名称 */
	name: string
	/** IP白名单数组 */
	ip_whitelist?: string[]
}

// API密钥创建响应数据
export interface CreateApiKeyResponse {
	/** API密钥ID */
	id: number
	/** 密钥名称 */
	name: string
	/** Access Key */
	access_key: string
	/** Account ID */
	account_id: string
	/** Secret Key */
	secret_key: string
	/** IP白名单 */
	ip_whitelist?: string[]
	/** 状态：1-启用，0-禁用 */
	status: number
	/** 创建时间戳 */
	created_at: number
}

// API密钥列表查询请求参数
export interface ApiKeyListRequest {
	/** 页码 */
	p?: number
	/** 每页数量 */
	rows?: number
	/** 关键词搜索 */
	keyword?: string
	/** 状态筛选：1-启用，0-禁用 */
	status?: number | string
}

// API密钥列表项
export interface ApiKeyItem {
	/** API密钥ID */
	id: number
	/** 密钥名称 */
	name: string
	/** Access Key */
	access_key: string
	/** Secret Key */
	secret_key: string
	/** Account ID */
	account_id: string
	/** IP白名单 */
	ip_whitelist?: string[]
	/** 状态：1-启用，0-禁用 */
	status: number
	/** 状态文本 */
	status_text?: string
	/** 最后使用时间 - 字符串格式 */
	last_used_at?: string | null
	/** 最后使用IP */
	last_used_ip?: string
	/** 创建时间 */
	created_at: string
	/** 更新时间 */
	updated_at: string
	/** UID */
	uid?: number
}

// API密钥列表响应数据
export interface ApiKeyListResponse {
	/** 数据列表 */
	data: ApiKeyItem[]
	/** 总数 */
	total: number
}

// API密钥删除请求参数
export interface DeleteApiKeyRequest {
	/** API密钥ID */
	config_id: number
}

// API密钥更新请求参数
export interface UpdateApiKeyRequest {
	/** API密钥ID */
	config_id: number
	/** 密钥名称 */
	name: string
	/** 状态：1-启用，0-禁用 */
	status: number
	/** IP白名单数组 */
	ip_whitelist?: string[]
}

// API密钥更新响应数据
export interface UpdateApiKeyResponse {
	/** 更新结果消息 */
	message?: string
}

// API密钥重新生成请求参数
export interface RegenerateApiKeyRequest {
	/** API密钥ID */
	config_id: number
}

// API密钥重新生成响应数据
export interface RegenerateApiKeyResponse {
	/** Access Key */
	access_key: string
	/** Account ID */
	account_id: string
	/** Secret Key */
	secret_key: string
	/** 重新生成结果消息 */
	message?: string
}

// API密钥删除响应数据
export interface DeleteApiKeyResponse {
	/** 删除结果消息 */
	message?: string
}
