import type { ApiResponse } from './api'

/**
 * 转发记录列表请求
 */
export interface ForwardListRequest {
  /** 域名 ID */
  domain_id: number
}

/**
 * 转发记录条目
 */
export interface ForwardItem {
  /** 转发记录 ID */
  id: number
  /** 域名 ID */
  domain_id: number
  /** 主机记录，例如 @、www */
  host: string
  /** 目标地址/值 */
  value: string
  /** 记录类型，例如 A/CNAME/URL 等 */
  type: string
  /** TTL 时间（秒） */
  ttl: number
  /** 状态（0 停用，1 启用） */
  status: number
  /** 创建时间（Unix 时间戳） */
  created_at: number
  /** 更新时间（Unix 时间戳） */
  updated_at: number
}

/** 转发记录列表数据 */
export interface ForwardListData extends Array<ForwardItem> {}

export type ForwardListResponse = ApiResponse<ForwardListData>

/**
 * 创建转发记录请求
 */
export interface ForwardCreateRequest {
  /** 域名 ID */
  domain_id: number
  /** 主机记录，例如 @、www */
  host: string
  /** 目标地址/值 */
  value: string
  /** 记录类型，例如 A/CNAME 等 */
  type: string
  /** TTL 时间（秒） */
  ttl: number
}

/** 创建成功返回创建的记录 ID 或空体，按后台实现而定 */
export type ForwardCreateResponse = ApiResponse<{ id?: number } | {}>

export interface ForwardIdRequest {
  /** 转发记录 ID */
  forward_id: number
}

export type ForwardDeleteRequest = ForwardIdRequest
export type ForwardDeleteResponse = ApiResponse<{}>

export interface ForwardEditRequest extends ForwardIdRequest {
  /** 主机记录 */
  host: string
  /** 目标地址/值 */
  value: string
  /** 记录类型 */
  type: string
  /** TTL 时间（秒） */
  ttl: number
}

export type ForwardEditResponse = ApiResponse<{}>

export type ForwardPauseRequest = ForwardIdRequest
export type ForwardPauseResponse = ApiResponse<{}>

export type ForwardStartRequest = ForwardIdRequest
export type ForwardStartResponse = ApiResponse<{}>
