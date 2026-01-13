import type { ApiResponse } from './api'

/**
 * 获取用户详情请求参数
 */
export interface GetUserDetailRequest {
	/** 页码，从 1 开始 */
	p?: number
	/** 联系人类型：个人/企业 等 */
	type?: number
	/** 每页条数 */
	rows?: number
	/** 审核状态 */
	status?: number
}

/**
 * 联系人模板项
 */
export interface ContactTemplateItem {
	/** 联系地址（中文） */
	address: string
	/** 联系地址（英文） */
	address_en: string
	/** 营业执照图片或编号 */
	business_license: string
	/** 城市 */
	city: string
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
	/** 证件号码 */
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
	/** 审核状态 */
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
	/** 认证通过时间，时间戳或字符串 */
	verify_time: number | string
}

/**
 * 获取用户详情响应消息
 */
export interface GetUserDetailMsg {
	/** 模板列表数据 */
	data: ContactTemplateItem[]
	/** 当前页码（字符串） */
	page: string
	/** 每页条数（字符串） */
	row: string
	/** 偏移量（字符串） */
	shift: string
	/** 总条数（字符串） */
	count: number
}

/**
 * 特殊响应：data 为字符串（如 "获取成功"），msg 为结构体
 */
export type GetUserDetailResponse = ApiResponse<GetUserDetailMsg>

/**
 * 创建联系人请求参数
 */
export interface CreateContactRequest {
	/** 用户 ID */
	uid?: number
	/** 模板名称 */
	template_name: string
	/** 模板类型：个人/企业 等 */
	type: number
	/** 注册者名称（中文） */
	owner_name: string
	/** 注册者名称（英文） */
	owner_name_en: string
	/** 联系人姓名 */
	contact_person: string
	/** 城市 */
	city: string
	/** 城市ID */
	city_id: string
	/** 联系地址（中文） */
	address: string
	/** 联系地址（英文） */
	address_en: string
	/** 邮政编码 */
	postal_code: string
	/** 联系电话 */
	phone: string
	/** 邮箱 */
	email: string
	/** 证件类型 */
	id_type: number
	/** 证件号 */
	id_number: string
	/** 企业联系人证件号码 */
	business_concat_id_number?: string
	/** 证件照（正面 Base64） */
	id_image_front: string
	/** 证件照（背面 Base64） */
	id_image_back: string
	/** 营业执照 */
	business_license?: string
	/** 是否设为默认模板（1 是，0 否） */
	is_default: number
}

/**
 * 创建联系人响应消息
 */
export type CreateContactResponse = ApiResponse<{}>

/**
 * 上传图片 Base64 请求参数
 */
export interface UploadImageBase64Request {
	/** 图片 Base64 字符串 */
	file: string
}

/**
 * 上传身份证正面图片请求参数
 */
export type UploadCardIdFrontRequest = UploadImageBase64Request
/**
 * 上传身份证正面图片响应消息
 */
export type UploadCardIdFrontResponse = ApiResponse<{
	file_path: string
	data: {
		name: string
		idnum: string
		address: string
	}
}>

/**
 * 上传身份证背面图片请求参数
 */
export type UploadCardIdBackRequest = UploadImageBase64Request
export type UploadCardIdBackResponse = ApiResponse<{
	file_path: string
	data: any
}>

/**
 * 上传营业执照图片请求参数
 */
export type UploadBusinessLicenseRequest = UploadImageBase64Request
export type UploadBusinessLicenseResponse = ApiResponse<{
	file_path: string
	data: any
}>

/**
 * 获取用户上传的图片请求参数
 */
export interface GetImagesByNameRequest {
	/** 图片文件名 */
	file: string
}

/**
 * 获取用户上传的图片响应消息
 */
export type GetImagesByNameResponse = ApiResponse<{
	images: any
	file_name: string
	image_data: string
}>

/**
 * 获取用户联系人详情请求参数
 */
export interface ContactDetailRequest {
	/** 注册者标识 ID */
	registrant_id: string
}

/**
 * 获取用户联系人详情响应消息
 */
export type ContactDetailResponse = ApiResponse<{
	status: number
	review_msg: string
}>

/**
 * 删除用户联系人请求参数
 */
export interface DelUserDetailRequest {
	/** 实名模板 ID */
	id: number
}
export type DelUserDetailResponse = ApiResponse<{}>
