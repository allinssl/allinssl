import { AxiosResponseData } from './public'

/** 授权列表请求参数 */
export interface AccessListParams {
	search?: string
	p?: number
	limit?: number
}

/** 授权项 */
export interface AccessItem {
	id: string
	name: string
	type: string
	access_type: ('dns' | 'host')[]
	create_time: string
	update_time: string
	config: string
}

/** 授权列表响应 */
export interface AccessListResponse extends AxiosResponseData {
	data: AccessItem[]
}

/** 授权类型 */
export interface AccessType {
	key: string
	name: string
}

/** 授权类型列表响应 */
export interface AccessTypesResponse extends AxiosResponseData {
	data: AccessType[]
}

/** 新增授权请求参数 */
export interface AddAccessParams<
	T =
		| SshAccessConfig
		| AliyunAccessConfig
		| TencentCloudAccessConfig
		| PanelAccessConfig
		| HuaWeiCloudAccessConfig
		| CloudflareAccessConfig
		| BaiduCloudAccessConfig
		| VolcengineAccessConfig
		| WestcnAccessConfig
		| BtWafSiteAccessConfig,
> {
	name: string
	type: string
	config: T
}

/** 修改授权请求参数 */
export interface UpdateAccessParams<
	T =
		| SshAccessConfig
		| AliyunAccessConfig
		| TencentCloudAccessConfig
		| PanelAccessConfig
		| HuaWeiCloudAccessConfig
		| CloudflareAccessConfig
		| BaiduCloudAccessConfig
		| BtWafSiteAccessConfig
		| VolcengineAccessConfig
		| WestcnAccessConfig,
> extends AddAccessParams<T> {
	id: string
}

/**
 * ssh 授权配置
 */
type SshAccessConfig = {
	host: string
	port: number
	user: string
} & ({ mode: 'password'; password: string; key?: never } | { mode: 'key'; key: string; password?: never })

/**
 * 阿里云授权配置
 */
export interface AliyunAccessConfig {
	access_key_id: string
	access_key_secret: string
}

/**
 * 腾讯云授权配置
 */
export interface TencentCloudAccessConfig {
	secret_id: string
	secret_key: string
}

/**
 * 面板授权（1panel、宝塔）
 */
export interface PanelAccessConfig {
	url: string
	api_key: string
	ignore_ssl: '0' | '1'
}

/**
 * 宝塔waf网站授权
 */
export interface BtWafSiteAccessConfig extends PanelAccessConfig {}
/**
 * 华为云授权配置
 */
export interface HuaWeiCloudAccessConfig {
	secret_key: string
	access_key: string
}

/**
 * 百度云授权配置
 */
export interface BaiduCloudAccessConfig extends HuaWeiCloudAccessConfig {}

/**
 * 火山引擎授权配置
 */
export interface VolcengineAccessConfig extends HuaWeiCloudAccessConfig {}

/**
 *  cloudflare 授权配置
 */
export interface CloudflareAccessConfig {
	api_key: string
	email: string
}

/**
 * 西部数码授权配置
 */
export interface WestcnAccessConfig {
	username: string
	password: string
}


/** 删除授权请求参数 */
export interface DeleteAccessParams {
	id: string
}

/** 获取DNS提供商列表请求参数 */
export interface GetAccessAllListParams {
	type: string
}

/** 工作流 dns 配置项 */
export interface AccessAllItem {
	id: number
	name: string
	type: string
}

/** 获取工作流 dns 配置响应 */
export interface GetAccessAllListResponse extends AxiosResponseData {
	data: AccessAllItem[]
}
