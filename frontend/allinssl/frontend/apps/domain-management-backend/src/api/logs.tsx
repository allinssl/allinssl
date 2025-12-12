/**
 * @fileoverview 域名日志管理相关 API 接口
 * @description 提供域名操作日志查询功能
 */

import { useApi } from "@api/index";
import type { ApiResponse } from "@/types/api";
import type { DomainLogItem } from "@/types/domain";

/**
 * 域名日志查询请求参数
 */
export interface FetchDomainLogsRequest {
  /** 域名 ID */
  domain_id: number;
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页条数 */
  page_size?: number;
  /** 操作类型筛选 */
  operation_type?: string;
  /** 开始时间 */
  start_time?: number;
  /** 结束时间 */
  end_time?: number;
}

/**
 * 域名日志响应数据
 */
export interface FetchDomainLogsData {
  /** 日志列表 */
  logs: DomainLogItem[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  page_size: number;
}

export type FetchDomainLogsResponse = ApiResponse<FetchDomainLogsData>;

/**
 * @description 获取域名操作日志
 * @description 查询指定域名的操作历史记录，支持分页和筛选
 * @param {FetchDomainLogsRequest} params 查询参数，包含域名ID、分页信息等
 * @returns {useAxiosReturn<FetchDomainLogsResponse, FetchDomainLogsRequest>} 返回域名日志列表
 */
export const fetchDomainLogs = (params: FetchDomainLogsRequest) =>
  useApi<FetchDomainLogsResponse, FetchDomainLogsRequest>(
    "/v1/domain/manage/logs",
    params,
  );