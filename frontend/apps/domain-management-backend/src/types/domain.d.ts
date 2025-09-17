/**
 * 域名列表查询请求参数
 */
export interface DomainListRequest {
	/** 页码，从 1 开始 */
	p?: number
	/** 每页条数 */
	rows?: number
	/** 域名状态过滤，数值枚举 */
	status?: number | ''
	/** 后缀过滤，例如 .com/.net，不含点时为纯后缀 */
	suffix?: string
	/** 关键字搜索，作用于域名 */
	keyword?: string
}

/**
 * 域名列表中的单项
 * 来源：域名列表接口 data 数组元素
 */
export interface DomainItem {
	/** 创建时间（Unix 时间戳） */
	created_at: number
	/** 绑定的 DNS 线路/配置 ID */
	dns_id: number
	/** 过期时间（字符串）或 null */
	expire_time: string | null
	/** 完整域名，例如 example.com */
	full_domain: string
	/** 域名记录 ID */
	id: number
	/** NS 服务器 1 */
	ns1: string
	/** NS 服务器 2 */
	ns2: string
	/** NS 状态，数值枚举 */
	ns_status: number
	/** 实名状态，数值枚举 */
	real_name_status: number
	/** 关联的实名模板 ID */
	real_name_template_id: number
	/** 注册时间（字符串）或 null */
	register_time: string | null
	/** 备注 */
	remark: string
	/** 域名状态，数值枚举 */
	status: number
	/** 域名后缀，例如 com/net */
	suffix: string
}

export interface DomainListData {
	/** 域名列表数据 */
	data: DomainItem[]
	/** 当前页码（可选） */
	p?: number
	/** 每页条数（可选） */
	rows?: number
	/** 总条数（可选） */
	count?: number
}

import type { ApiResponse } from './api'

export type DomainListResponse = ApiResponse<DomainListData>

/**
 * 域名详情请求参数
 */
export interface DomainDetailRequest {
	/** 域名 ID */
	domain_id: number
	/** 域名类型：1=宝塔内部域名，2=外部域名 */
	domain_type?: number
}

/**
 * DNS 解析记录
 */
export interface DnsRecordItem {
	/** MX 优先级 */
	MX: number
	/** TTL 时间（秒） */
	TTL: number
	/** 创建时间（Unix 时间戳） */
	created_at: number
	/** 旧版/外部域名 ID（可能保留字段） */
	domainID: number
	/** 域名 ID */
	domain_id: number
	/** 主机记录，例如 @、www */
	record: string
	/** 旧版/外部记录 ID（可能保留字段） */
	recordID: number
	/** 记录 ID */
	record_id: number | string
	/** 备注 */
	remark: string
	/** 记录状态，数值枚举 */
	state: number
	/** 记录类型，例如 A/CNAME/MX 等 */
	type: string
	/** 用户 ID */
	uid: number
	/** 记录值，例如 IP 地址或域名 */
	value: string
	/** 视图 ID（如有多线路） */
	viewID: number
}

/**
 * 域名详情信息
 */
export interface DomainInfo {
	/** 创建时间（Unix 时间戳） */
	created_at: number
	/** DNS 配置 ID */
	dns_id: number
	/** DNS 更新锁（1 锁定，0 解锁） */
	dns_lock: number
	/** DNS 状态 */
	dns_state: number
	/** DNS 类型/供应商标识 */
	dns_type: number
	/** 域名 ID（可能为第三方系统 ID） */
	domain_id: number
	/** 二级域名部分，例如 example */
	domain_name: string
	/** 过期时间（时间戳）或 null */
	expire_time: number | null
	/** 完整域名，例如 example.com */
	full_domain: string
	/** 本系统中的域名主键 ID */
	id: number
	/** 上次操作人 ID（可为 null） */
	last_operator_id: number | null
	/** 上次操作类型（枚举） */
	last_operator_type: number
	/** NS 服务器 1（可为 null） */
	ns1: string | null
	/** NS 服务器 2（可为 null） */
	ns2: string | null
	/** NS 服务器 3（可为 null） */
	ns3: string | null
	/** NS 服务器 4（可为 null） */
	ns4: string | null
	/** NS 服务器 5（可为 null） */
	ns5: string | null
	/** NS 服务器 6（可为 null） */
	ns6: string | null
	/** NS 状态（枚举） */
	ns_status: number
	/** 订单号 */
	order_no: string
	/** 第三方订单号 */
	order_no_bt: string
	/** 注册者名称（中文，可为 null） */
	owner_name: string | null
	/** 注册者名称（英文，可为 null） */
	owner_name_en: string | null
	/** 实名状态（枚举） */
	real_name_status: number
	/** 实名模板 ID */
	real_name_template_id: number
	/** 注册时间（时间戳）或 null */
	register_time: number | null
	/** 注册商名称（可为 null） */
	registrar: string | null
	/** 注册商侧域名 ID（可为 null） */
	registrar_domain_id: string | null
	/** 备注 */
	remark: string
	/** 域名状态（枚举） */
	status: number
	/** 域名后缀，例如 com/net */
	suffix: string
	/** 转移锁（1 锁定，0 解锁） */
	transfer_lock: number
	/** 用户 ID */
	uid: number
	/** 更新锁（1 锁定，0 解锁） */
	update_lock: number
	/** 更新时间（Unix 时间戳） */
	updated_at: number
	/** 是否自动续费（1 是，0 否） */
	auto_renew: number
	/** 隐私保护（0 否，1 是） */
	privacy: number
}

/**
 * 实名模板详情
 */
export interface RealNameInfo {
	/** 联系地址（中文） */
	address: string
	/** 联系地址（英文） */
	address_en: string
	/** 营业执照或相关资质 */
	business_license: string
	/** 城市 */
	city: string
	/** 城市ID */
	city_id: string
	/** 联系人姓名 */
	contact_person: string
	/** 创建时间（Unix 时间戳） */
	created_at: number
	/** 邮箱 */
	email: string
	/** 审核失败原因 */
	fail_reason: string
	/** 模板 ID */
	id: number
	/** 证件照（背面） */
	id_image_back: string
	/** 证件照（正面） */
	id_image_front: string
	/** 证件号 */
	id_number: string
	/** 证件类型（枚举） */
	id_type: number
	/** 是否默认模板（1 是，0 否） */
	is_default: number
	/** 注册者名称（中文） */
	owner_name: string
	/** 注册者名称（英文） */
	owner_name_en: string
	/** 联系电话 */
	phone: string
	/** 邮政编码 */
	postal_code: string
	/** 注册者标识 ID */
	registrant_id: string
	/** 审核状态（枚举） */
	status: number
	/** 模板名称 */
	template_name: string
	/** 模板状态（字符串描述） */
	template_status: string
	/** 模板类型：个人/企业 等 */
	type: number
	/** 用户 ID */
	uid: number
	/** 更新时间（Unix 时间戳） */
	updated_at: number
	/** 认证通过时间（字符串） */
	verify_time: string
}


/**
 * 域名详情响应数据
 */
export interface DomainDetailData {
	/** DNS 解析记录列表 */
	dns_records: DnsRecordItem[]
	/** 域名详情信息 */
	domain_info: DomainInfo
	/** 实名模板信息 */
	real_name_info: RealNameInfo
	/** 实名信息更新状态 */
	real_name_update_info: RealNameInfo
	/** 隐私保护信息 */
	privacy_info: PrivacyInfo
}

/**
 * 域名详情响应体
 */
export type DomainDetailResponse = ApiResponse<DomainDetailData>

// 更新DNS服务器
export interface UpdateDnsServersRequest {
	/** 域名 ID */
	domain_id: number
	/** 新的服务器 1 */
	dns1: string
	/** 新的服务器 2 */
	dns2: string
	/** 新的服务器 3 */
	dns3: string
	/** 新的服务器 4 */
	dns4: string
	/** 新的服务器 5 */
	dns5: string
	/** 新的服务器 6 */
	dns6: string
}

export interface UpdateDnsServersData {
	/** 更新后的服务器 1 */
	dns1: string
	/** 更新后的服务器 2 */
	dns2: string
	/** 更新后的服务器 3 */
	dns3: string
	/** 更新后的服务器 4 */
	dns4: string
	/** 更新后的服务器 5 */
	dns5: string
	/** 更新后的服务器 6 */
	dns6: string
}

export type UpdateDnsServersResponse = ApiResponse<UpdateDnsServersData>

// 设置域名安全状态
export interface SetDomainSecurityRequest {
	/** 域名 ID */
	domain_id: number
	/** 安全项类型：update（更新锁）/ transfer（转移锁） */
	type: 'update' | 'transfer'
	/** 锁定状态：1 开启，0 关闭 */
	status: 0 | 1
}

export interface SetDomainSecurityData {
	/** 执行动作描述 */
	action: string
	/** 域名 ID */
	domain_id: number
	/** 生效后的状态 */
	status: number
	/** 安全项类型 */
	type: 'update' | 'transfer'
}

export interface PrivacyInfo {
	/** 邮箱 */
	email: string
	/** 结束时间 */
	end_time: number
	/** 开始时间 */
	start_time: number
}

export type SetDomainSecurityResponse = ApiResponse<SetDomainSecurityData>

// 手动刷新域名注册状态
export interface RefreshDomainStatusRequest {
	/** 域名 ID */
	domain_id: number
}

export interface RefreshDomainStatusData {
	/** 刷新失败的数量 */
	failed_count: number
	/** 刷新失败的域名列表 */
	failed_domains: string[]
	/** 描述信息 */
	message: string
	/** 是否全部成功 */
	success: boolean
	/** 刷新成功的数量 */
	success_count: number
	/** 总计数量 */
	total: number
}

export type RefreshDomainStatusResponse = ApiResponse<RefreshDomainStatusData>

/**
 * 域名操作日志项
 */
export interface DomainLogItem {
	/** 日志ID */
	id: number
	/** 操作类型 */
	operation_type: string
	/** 操作内容 */
	content: string
	/** 操作人 */
	operator: string
	/** 操作IP */
	ip: string
	/** 操作时间（Unix 时间戳） */
	created_at: number
	/** 操作状态 */
	status: 'success' | 'warning' | 'error' | 'info'
}

// -------------------- 域名价格查询 --------------------
export interface DomainPriceQueryRequest {
	/** 完整域名，支持逗号分隔 */
	domain: string
	/** 注册/续费年限（1-10），可选，默认1 */
	year?: number
	/** register注册, renew续费, transfer转入, redemption赎回 */
	type: 'register' | 'renew' | 'transfer' | 'redemption'
}

export interface DomainPriceResult {
  domain: string;
  year: number;
  /** 原价（字符串金额） */
  price: string;
  /** 折扣价（字符串金额） */
  discount_price: string;
  /** 节省金额（字符串金额） */
  savings: string;
  /** 失败信息（可选） */
  error?: string;
}

export interface DomainPriceQueryData {
  query_time: string;
  year: number;
  results: DomainPriceResult[];
}

export type DomainPriceQueryResponse = ApiResponse<DomainPriceQueryData>;


export type DomainAutoRenewRequest = {
	domain_id: number
	status: 0 | 1
}


export interface DomainRealNameUpdateRequest {
	/** 域名 ID */
	domain_id: number
	/** 新的实名模板 ID */
	new_registrant_id: string
}

export interface PrivacyRequest {
	/** 1:新购 2:续费 */
	type: number
	/** 域名 */
	domain: string
	/** 年份 */
	year: number
	/** 邮箱 */
	email?: string
}
/** 保护隐私下单返回数据 */
export interface PrivacyData {
	create_time: string
	discount_price: number
	domain_count: number
	expire_time: string
	order_id: number
	order_no: string
	original_price: number
	payment_url: string
	total_price: number
	ali: string // 支付宝二维码或链接
	wx: string // 微信二维码或链接
}

export type PrivacyResponse = ApiResponse<PrivacyRequest>

export interface PrivacyPriceRequest {
	/** 1:新购 2:续费 */
	type: number
	/** 年份 */
	year: number
}