/**
 * @fileoverview API密钥管理相关 API 接口
 * @description 提供API密钥的创建、更新、删除、查询等管理功能
 */

import { useApi } from '@api/index'
import type { ApiResponse } from '@/types/api'
import type { CreateApiKeyRequest, CreateApiKeyResponse, ApiKeyListRequest, ApiKeyListResponse, UpdateApiKeyRequest, UpdateApiKeyResponse, RegenerateApiKeyRequest, RegenerateApiKeyResponse, DeleteApiKeyRequest, DeleteApiKeyResponse } from '@/types/api-key'

/**
 * @description 创建API密钥
 * @param {CreateApiKeyRequest} params 创建参数，包含密钥名称和IP白名单
 * @returns {useAxiosReturn<ApiResponse<CreateApiKeyResponse>, CreateApiKeyRequest>} 返回创建操作结果
 */
export const createApi = (params: CreateApiKeyRequest) =>
	useApi<ApiResponse<CreateApiKeyResponse>, CreateApiKeyRequest>('/v1/user/apiconfig/create', params)

/**
 * @description 获取API密钥列表
 * @param {ApiKeyListRequest} params 查询参数，包含分页和筛选条件
 * @returns {useAxiosReturn<ApiResponse<ApiKeyListResponse>, ApiKeyListRequest>} 返回列表数据
 */
export const getApiKeyList = (params: ApiKeyListRequest) =>
	useApi<ApiResponse<ApiKeyListResponse>, ApiKeyListRequest>('/v1/user/apiconfig/list', params)

/**
 * @description 更新API密钥
 * @param {UpdateApiKeyRequest} params 更新参数，包含密钥ID、名称、状态和IP白名单
 * @returns {useAxiosReturn<ApiResponse<UpdateApiKeyResponse>, UpdateApiKeyRequest>} 返回更新操作结果
 */
export const updateApiKey = (params: UpdateApiKeyRequest) =>
	useApi<ApiResponse<UpdateApiKeyResponse>, UpdateApiKeyRequest>('/v1/user/apiconfig/update', params)

/**
 * @description 重新生成API密钥
 * @param {RegenerateApiKeyRequest} params 重新生成参数，包含密钥ID
 * @returns {useAxiosReturn<ApiResponse<RegenerateApiKeyResponse>, RegenerateApiKeyRequest>} 返回重新生成操作结果
 */
export const regenerateApiKey = (params: RegenerateApiKeyRequest) =>
	useApi<ApiResponse<RegenerateApiKeyResponse>, RegenerateApiKeyRequest>('/v1/user/apiconfig/regenerate', params)

/**
 * @description 删除API密钥
 * @param {DeleteApiKeyRequest} params 删除参数，包含密钥ID
 * @returns {useAxiosReturn<ApiResponse<DeleteApiKeyResponse>, DeleteApiKeyRequest>} 返回删除操作结果
 */
export const deleteApiKey = (params: DeleteApiKeyRequest) =>
	useApi<ApiResponse<DeleteApiKeyResponse>, DeleteApiKeyRequest>('/v1/user/apiconfig/delete', params)

