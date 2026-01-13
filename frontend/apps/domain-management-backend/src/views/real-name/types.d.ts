/**
 * 实名模板管理页面类型定义
 */

// 重新导出API类型
export type {
	GetUserDetailRequest,
	GetUserDetailResponse,
	ContactTemplateItem,
	DelUserDetailRequest,
	DelUserDetailResponse,
	CreateContactRequest,
	CreateContactResponse,
} from '@/types/real-name'

/**
 * 实名模板类型枚举
 */
export enum TemplateType {
	/** 个人 */
	PERSONAL = 1,
	/** 企业 */
	ENTERPRISE = 2,
}

/**
 * 证件类型枚举
 */
export enum CertificateType {
	/** 身份证 */
	ID_CARD = 1,
	/** 营业执照 */
	BUSINESS_LICENSE = 2,
	/** 护照 */
	PASSPORT = 3,
}

/**
 * 模板状态枚举
 */
export enum TemplateStatus {
	/** 待审核 */
	PENDING = 0,
	/** 已认证 */
	VERIFIED = 1,
	/** 审核失败 */
	REJECTED = 2,
}

/**
 * NTag组件类型
 */
export type TagType = 'default' | 'success' | 'warning' | 'error' | 'info'

/**
 * 实名模板数据接口（基于API返回的ContactTemplateItem）
 */
export interface RealNameTemplate {
	/** 模板ID */
	id: number
	/** 模板名称 */
	template_name: string
	/** 关联邮箱 */
	email: string
	/** 模板类型 */
	type: number
	/** 证件类型 */
	id_type: number
	/** 证件号码 */
	id_number: string
	/** 联系电话 */
	phone: string
	/** 状态 */
	status: number
	/** 注册者名称 */
	owner_name: string
	/** 联系人姓名 */
	contact_person: string
	/** 联系地址 */
	address: string
	/** 城市 */
	city: string
	/** 城市区号 */
	city_id: string
	/** 邮政编码 */
	postal_code: string
	/** 注册者标识ID */
	registrant_id: string
	/** 审核失败原因 */
	fail_reason: string
	/** 是否默认模板 */
	is_default: number
	/** 创建时间 */
	created_at: number
	/** 更新时间 */
	updated_at: number
	/** 英文所有者名称 */
	owner_name_en: string
	/** 英文地址 */
	address_en: string
	/** 认证通过时间 */
	verify_time: number | string
}

/**
 * 筛选表单数据
 */
export interface FilterFormData {
	/** 搜索关键词 */
	search: string
	/** 模板类型 */
	type: number | null
	/** 状态 */
	status: number | null
}

/**
 * 获取模板列表请求参数
 */
export interface FetchTemplatesRequest {
	/** 页码 */
	p: number
	/** 每页数量 */
	rows: number
	/** 搜索关键词 */
	search?: string
	/** 模板类型 */
	type?: number
	/** 状态 */
	status?: number
}

/**
 * 模板类型选项
 */
export interface TemplateTypeOption {
	label: string
	value: number
}

/**
 * 模板状态选项接口
 */
export interface TemplateStatusOption {
	label: string
	value: number
}

/**
 * 域名备案模板表单数据接口
 */
export interface DomainRegistrationFormData {
	// 基础信息
	/** 模板名称 */
	template_name: string
	/** 模板类型 1-个人, 2-企业 */
	type: number
	/** 1身份证，2营业执照，3其他-统一社会信用代码，4境外机构证件,5护照,6统一社会信用代码,7社会团体法人登记证书,8民办非企业单位登记证书，9组织机构代码证，10事业单位法人证书，11律师事务所执业许可证，12军官证 */
	id_type: number
	/** 证件号码 */
	id_number: string
	/** 证件正面照片 */
	id_image_front: string | string[]
	/** 证件背面照片 */
	id_image_back: string | string[]
	/** 营业执照照片 */
	business_license: string | string[]
	/** 是否默认模板 */
	is_default: boolean
	/** 企业联系人证件号码 */
	business_concat_id_number: string
	// 中文模板信息
	/** 中文模板信息 */
	owner_name: string
	/** 联系人姓名 */
	contact_person: string
	/** 联系电话 */
	phone: string
	/** 电子邮箱 */
	email: string
	/** 所在地区 - 级联选择器值数组 */
	city: string
	/** 城市ID */
	city_id: string[] | string
	/** 详细地址 */
	address: string
	/** 邮政编码 */
	postal_code: string
	// 英文模板信息
	/** 英文所有者名称 */
	owner_name_en: string
	/** 英文地址 */
	address_en: string
}
