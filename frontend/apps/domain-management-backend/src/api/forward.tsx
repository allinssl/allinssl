/**
 * @fileoverview URL转发管理相关 API 接口
 * @description 提供URL转发记录的创建、编辑、删除、启用/停用等管理功能
 */

import { useApi } from '@api/index'
import type {
  ForwardListRequest,
  ForwardListResponse,
  ForwardCreateRequest,
  ForwardCreateResponse,
  ForwardDeleteRequest,
  ForwardDeleteResponse,
  ForwardEditRequest,
  ForwardEditResponse,
  ForwardPauseRequest,
  ForwardPauseResponse,
  ForwardStartRequest,
  ForwardStartResponse,
} from '@/types/forward'

/**
 * @description 获取转发记录列表
 * @description 获取指定域名的所有URL转发记录
 * @param {ForwardListRequest} params 查询参数，包含域名ID
 * @returns {useAxiosReturn<ForwardListResponse, ForwardListRequest>} 返回转发记录列表
 */
export const fetchForwardList = (params: ForwardListRequest) =>
  useApi<ForwardListResponse, ForwardListRequest>('/v1/dns/forward/list', params)

/**
 * @description 创建转发记录
 * @description 为指定域名创建新的URL转发记录
 * @param {ForwardCreateRequest} params 创建转发记录所需参数
 * @returns {useAxiosReturn<ForwardCreateResponse, ForwardCreateRequest>} 返回创建结果
 */
export const createForward = (params: ForwardCreateRequest) =>
  useApi<ForwardCreateResponse, ForwardCreateRequest>('/v1/dns/forward/create', params)

/**
 * @description 删除转发记录
 * @description 删除指定的URL转发记录
 * @param {ForwardDeleteRequest} params 删除参数，包含转发记录ID
 * @returns {useAxiosReturn<ForwardDeleteResponse, ForwardDeleteRequest>} 返回删除结果
 */
export const deleteForward = (params: ForwardDeleteRequest) =>
  useApi<ForwardDeleteResponse, ForwardDeleteRequest>('/v1/dns/forward/delete', params)

/**
 * @description 编辑转发记录
 * @description 修改现有URL转发记录的配置信息
 * @param {ForwardEditRequest} params 编辑参数，包含转发记录ID和新的配置
 * @returns {useAxiosReturn<ForwardEditResponse, ForwardEditRequest>} 返回编辑结果
 */
export const editForward = (params: ForwardEditRequest) =>
  useApi<ForwardEditResponse, ForwardEditRequest>('/v1/dns/forward/edit', params)

/**
 * @description 停用转发记录
 * @description 暂停指定的URL转发记录服务
 * @param {ForwardPauseRequest} params 停用参数，包含转发记录ID
 * @returns {useAxiosReturn<ForwardPauseResponse, ForwardPauseRequest>} 返回停用结果
 */
export const pauseForward = (params: ForwardPauseRequest) =>
  useApi<ForwardPauseResponse, ForwardPauseRequest>('/v1/dns/forward/pause', params)

/**
 * @description 启用转发记录
 * @description 启用之前停用的URL转发记录服务
 * @param {ForwardStartRequest} params 启用参数，包含转发记录ID
 * @returns {useAxiosReturn<ForwardStartResponse, ForwardStartRequest>} 返回启用结果
 */
export const startForward = (params: ForwardStartRequest) =>
  useApi<ForwardStartResponse, ForwardStartRequest>('/v1/dns/forward/start', params)
