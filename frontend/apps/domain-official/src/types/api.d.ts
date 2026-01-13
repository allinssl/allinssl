/**
 * @file API 类型声明
 * 参考文档：apps/official/doc/api.md
 *
 * - 统一返回结构：{ status, code, message, data, timestamp }
 * - 仅允许方法：GET、POST
 */

/**
 * 成功响应
 * @template T 返回数据的类型
 */
export type ApiSuccess<T = any> = {
  /** 请求是否成功（恒为 true） */
  status: true
  /** 业务状态码（成功为 0） */
  code: 0
  /** 描述信息 */
  message: string
  /** 业务数据 */
  data: T
  /** 服务器时间戳（可选） */
  timestamp?: number
}

/**
 * 失败响应
 */
export type ApiError = {
  /** 请求是否成功（恒为 false） */
  status: false
  /** 业务状态码（非 0）或 HTTP 状态码兜底 */
  code: number
  /** 错误描述 */
  message: string
  /** 失败时的上下文数据（可选） */
  data?: any
  /** 服务器时间戳（可选） */
  timestamp?: number
}

/**
 * 统一响应类型
 */
export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

/**
 * 允许的 HTTP 方法
 */
export type HttpMethod = 'GET' | 'POST'

/**
 * 通用请求配置
 */
export interface RequestConfig<TBody = any> {
  /** 相对路径，例如 /admin/check */
  url: string
  /** 请求方法，仅允许 GET / POST */
  method?: HttpMethod
  /** 请求体（GET 时将被序列化为查询字符串） */
  data?: TBody
  /** 额外请求头（会与鉴权头合并） */
  headers?: Record<string, string>
  /** 超时时间（毫秒） */
  timeout?: number
}

/**
 * 客户端初始化与拦截器配置
 */
export interface ApiClientOptions {
  /** 基础路径，默认 /api/v1 */
  baseURL?: string
  /** API 密钥（写入请求头 X-API-Key） */
  apiKey?: string
  /** 用户 ID（写入请求头 X-UID） */
  uid?: string
  /** 跨域时是否携带凭据 */
  withCredentials?: boolean
  /** 超时时间（毫秒） */
  timeout?: number
  /** 请求拦截 */
  onRequest?: (cfg: RequestConfig) => RequestConfig | void
  /** 响应拦截（优先于内置判定） */
  onResponse?: (res: ApiResponse<any>, cfg: RequestConfig) => ApiResponse<any> | void
  /** 错误拦截（规范化错误后抛出） */
  onError?: (err: any, cfg: RequestConfig) => any
}
