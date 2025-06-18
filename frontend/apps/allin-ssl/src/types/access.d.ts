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
		| BtWafSiteAccessConfig
		| GoDaddyAccessConfig
		| QiniuAccessConfig
		| NamecheapAccessConfig
		| NS1AccessConfig
		| CloudnsAccessConfig
		| AwsAccessConfig
		| AzureAccessConfig
		| NamesiloAccessConfig
		| NamedotcomAccessConfig
		| BunnyAccessConfig
		| GcoreAccessConfig
		| JdcloudAccessConfig
		| DogeAccessConfig
		| PluginAccessConfig,
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
		| WestcnAccessConfig
		| GoDaddyAccessConfig
		| QiniuAccessConfig
		| NamecheapAccessConfig
		| NS1AccessConfig
		| CloudnsAccessConfig
		| AwsAccessConfig
		| AzureAccessConfig
		| NamesiloAccessConfig
		| NamedotcomAccessConfig
		| BunnyAccessConfig
		| GcoreAccessConfig
		| JdcloudAccessConfig
		| DogeAccessConfig
		| PluginAccessConfig,
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

/**
 * GoDaddy 授权配置
 */
export interface GoDaddyAccessConfig {
	api_key: string
	api_secret: string
}

/**
 * 七牛云授权配置
 */
export interface QiniuAccessConfig {
	access_key: string
	access_secret: string
}

/**
 * Namecheap授权配置
 */
export interface NamecheapAccessConfig {
	api_user: string
	api_key: string
}

/**
 * NS1授权配置
 */
export interface NS1AccessConfig {
	api_key: string
}

/**
 * ClouDNS授权配置
 */
export interface CloudnsAccessConfig {
	auth_id: string
	auth_password: string
}

/**
 * AWS授权配置
 */
export interface AwsAccessConfig {
	access_key_id: string
	secret_access_key: string
}

/**
 * Azure授权配置
 */
export interface AzureAccessConfig {
	tenant_id: string
	client_id: string
	client_secret: string
	environment: string
}

/**
 * Namesilo授权配置
 */
export interface NamesiloAccessConfig {
	api_key: string
}

/**
 * Name.com授权配置
 */
export interface NamedotcomAccessConfig {
	username: string
	api_token: string
}

/**
 * Bunny授权配置
 */
export interface BunnyAccessConfig {
	api_key: string
}

/**
 * Gcore授权配置
 */
export interface GcoreAccessConfig {
	api_token: string
}

/**
 * 京东云授权配置
 */
export interface JdcloudAccessConfig {
	access_key_id: string
	secret_access_key: string
}

/**
 * 多吉云授权配置
 */
export interface DogeAccessConfig {
	access_key_id: string
	access_key_secret: string
}

/**
 * Plugin 授权配置
 */
export interface PluginAccessConfig {
	name: string
	config: Record<string, any> | string
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

/**
 * 获取ACME账户列表的请求参数
 */
export interface AcmeAccountListParams {
	search?: string
	p: string
	limit: string
	ca?: string
}

/**
 * ACME账户项目
 */
export interface AcmeAccountItem {
	id: number
	email: string
	ca: string
	Kid?: string
	HmacEncoded?: string
	CADirURL?: string
	create_time: string
	update_time: string
	config?: string
}

/**
 * 获取ACME账户列表的响应
 */
export interface AcmeAccountListResponse extends AxiosResponseData {
	data: AcmeAccountItem[]
}

/**
 * 添加ACME账户的请求参数
 */
export interface AcmeAccountAddParams {
	email: string
	ca: string
	Kid?: string
	HmacEncoded?: string
	CADirURL?: string
}

/**
 * 修改ACME账户的请求参数
 */
export interface AcmeAccountUpdateParams extends AcmeAccountAddParams {
	id: string
}

/**
 * 删除ACME账户的请求参数
 */
export interface AcmeAccountDeleteParams {
	id: string
}

// 保持向后兼容的类型别名
export interface EabListParams {
	p: number
	limit: number
}

export interface EabItem {
	id: number
	type: string
	email: string
	Kid?: string
	HmacEncoded?: string
	ca: string
	CADirURL?: string
	create_time: string
	update_time: string
}

export interface EabListResponse extends AxiosResponseData {
	data: EabItem[]
}

export interface EabAddParams {
	email: string
	ca: string
	Kid?: string
	HmacEncoded?: string
	CADirURL?: string
}

export interface EabUpdateParams extends EabAddParams {
	id: string
}

export interface EabDeleteParams {
	id: string
}

export interface EabGetAllListParams {
	ca: string
}

export interface EabGetAllListResponse extends AxiosResponseData {
	data: EabItem[]
}

/**
 * 测试授权API的请求参数
 */
export interface TestAccessParams {
	id: string
	type: string
}

/**
 * 网站列表的请求参数
 */
export interface GetSitesParams {
	search?: string
	p?: string
	limit?: string
	id: string
	type: string
}

/**
 * 网站列表的响应
 */
export interface GetSitesResponse extends AxiosResponseData {
	data: { siteName: string; id: string }[]
}

/**
 * 获取插件列表的请求参数
 * @param {string} name 插件名称
 */
export interface GetPluginsActionsParams {
	name: string
}

/**
 * @description 获取插件列表的响应
 */
export interface GetPluginsResponse extends AxiosResponseData {
	data: {
		Path: string
		actions: { name: string; description: string; params: Record<string, any> }[]
		author: string
		description: string
		name: string
		version: string
	}[]
}

/**
 * 获取插件列表的响应
 */
export interface GetPluginsActionsResponse extends AxiosResponseData {
	data: {
		name: string
		description: string
		params: string
	}[]
}