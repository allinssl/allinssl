/**
 * 通用 API 响应类型定义
 *
 * 用于统一整个应用的API响应格式，避免在各个模块中重复定义
 */

/**
 * 标准 API 响应封装
 *
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T = any> {
  /** 业务状态码，0 表示成功 */
  code: number
  /**
   * 提示信息
   * 注意：某些模块可能返回对象结构而非字符串
   */
  msg: string
  /**
   * 状态标记
   * 不同模块可能使用 boolean 或 number 类型
   */
  status: boolean
  /** 响应数据载体 */
  data: T
}

/**
 * 空响应数据结构
 * 用于表示无返回体的API响应
 */
export interface EmptyData {}
