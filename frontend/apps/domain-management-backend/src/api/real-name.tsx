/**
 * @fileoverview 实名认证相关 API 接口
 * @description 提供实名认证模板管理、图片上传、审核进度查询等功能
 */

import { useApi } from '@api/index'
import type {
	GetUserDetailRequest,
	GetUserDetailResponse,
	CreateContactRequest,
	CreateContactResponse,
	UploadCardIdFrontRequest,
	UploadCardIdFrontResponse,
	UploadCardIdBackRequest,
	UploadCardIdBackResponse,
	UploadBusinessLicenseRequest,
	UploadBusinessLicenseResponse,
	GetImagesByNameRequest,
	GetImagesByNameResponse,
	ContactDetailRequest,
	ContactDetailResponse,
	DelUserDetailRequest,
	DelUserDetailResponse,
} from '@/types/real-name'

/**
 * @description 获取实名信息模板列表
 * @description 获取用户的实名认证模板列表，支持分页和类型筛选
 * @param {GetUserDetailRequest} params 查询参数，包含分页、类型等筛选条件
 * @returns {useAxiosReturn<GetUserDetailResponse, GetUserDetailRequest>} 返回实名认证模板列表
 */
export const fetchContactUserDetail = (params: GetUserDetailRequest) =>
	useApi<GetUserDetailResponse, GetUserDetailRequest>('/v1/contact/get_user_detail', params)

/**
 * @description 创建实名信息模板
 * @description 创建新的实名认证信息模板，支持个人和企业两种类型
 * @param {CreateContactRequest} params 创建模板所需的所有实名信息
 * @returns {useAxiosReturn<CreateContactResponse, CreateContactRequest>} 返回创建结果
 */
export const createContact = (params: CreateContactRequest) =>
	useApi<CreateContactResponse, CreateContactRequest>('/v1/contact/create', params)

/**
 * @description 上传身份证正面图片
 * @description 上传身份证正面的图片文件，支持base64格式
 * @param {UploadCardIdFrontRequest} params 上传参数，包含图片文件数据
 * @returns {useAxiosReturn<UploadCardIdFrontResponse, UploadCardIdFrontRequest>} 返回上传结果
 */
export const uploadCardIdFront = (params: UploadCardIdFrontRequest) =>
	useApi<UploadCardIdFrontResponse, UploadCardIdFrontRequest>('/v1/contact/upload_cardid_front', params)

/**
 * @description 上传身份证背面图片
 * @description 上传身份证背面的图片文件，支持base64格式
 * @param {UploadCardIdBackRequest} params 上传参数，包含图片文件数据
 * @returns {useAxiosReturn<UploadCardIdBackResponse, UploadCardIdBackRequest>} 返回上传结果
 */
export const uploadCardIdBack = (params: UploadCardIdBackRequest) =>
	useApi<UploadCardIdBackResponse, UploadCardIdBackRequest>('/v1/contact/upload_cardid_back', params)

/**
 * @description 上传营业执照图片
 * @description 上传企业营业执照图片，仅企业类型模板需要
 * @param {UploadBusinessLicenseRequest} params 上传参数，包含营业执照图片数据
 * @returns {useAxiosReturn<UploadBusinessLicenseResponse, UploadBusinessLicenseRequest>} 返回上传结果
 */
export const uploadBusinessLicense = (params: UploadBusinessLicenseRequest) =>
	useApi<UploadBusinessLicenseResponse, UploadBusinessLicenseRequest>('/v1/contact/upload_business_license', params)

/**
 * @description 获取用户上传的图片
 * @description 根据图片名称获取用户之前上传的图片信息
 * @param {GetImagesByNameRequest} params 查询参数，包含图片名称
 * @returns {useAxiosReturn<GetImagesByNameResponse, GetImagesByNameRequest>} 返回图片信息
 */
export const getImagesByName = (params: GetImagesByNameRequest) =>
	useApi<GetImagesByNameResponse, GetImagesByNameRequest>('/v1/contact/get_images_by_name', params)

/**
 * @description 刷新实名认证审核进度
 * @description 获取指定实名认证模板的详细信息和审核进度
 * @param {ContactDetailRequest} params 查询参数，包含注册人ID
 * @returns {useAxiosReturn<ContactDetailResponse, ContactDetailRequest>} 返回实名认证详细信息
 */
export const fetchContactDetail = (params: ContactDetailRequest) =>
	useApi<ContactDetailResponse, ContactDetailRequest>('/v1/contact/detail', params)

/**
 * @description 删除实名认证模板
 * @description 删除指定的实名认证信息模板
 * @param {DelUserDetailRequest} params 删除参数，包含注册人ID
 * @returns {useAxiosReturn<DelUserDetailResponse, DelUserDetailRequest>} 返回删除结果
 */
export const deleteUserDetail = (params: DelUserDetailRequest) =>
	useApi<DelUserDetailResponse, DelUserDetailRequest>('/v1/contact/del_user_detail', params)
