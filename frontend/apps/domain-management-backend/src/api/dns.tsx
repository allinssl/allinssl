/**
 * @fileoverview DNS解析管理相关 API 接口
 * @description 提供DNS解析记录的查询、创建、更新、删除等管理功能
 */

import { useApi } from "@api/index";
import type {
  GetViewsResponse,
  GetRecordTypeListResponse,
  GetDnsRecordListRequest,
  GetDnsRecordListResponse,
  CreateDnsRecordRequest,
  DeleteDnsRecordRequest,
  UpdateDnsRecordRequest,
  ToggleDnsRecordRequest,
} from "@/types/dns";
import type { ApiResponse } from "@/types/api";

/**
 * @description 获取线路列表
 * @description 获取DNS解析可用的线路列表，包含线路ID、名称等信息
 * @returns {useAxiosReturn<GetViewsResponse>} 返回线路列表数据
 */
export const getViews = () =>
  useApi<GetViewsResponse>("/v1/dns/record/get_views");

/**
 * @description 获取解析记录类型列表
 * @description 获取DNS支持的解析记录类型列表，包含类型名称、描述等信息
 * @returns {useAxiosReturn<GetRecordTypeListResponse>} 返回记录类型列表数据
 */
export const getRecordTypeList = () =>
  useApi<GetRecordTypeListResponse>("/v1/dns/record/get_record_type_list");

/**
 * @description 获取解析记录列表
 * @description 获取指定域名的DNS解析记录列表，支持分页和搜索
 * @param {GetDnsRecordListRequest} params 查询参数，包含域名ID、分页、搜索等条件
 * @returns {useAxiosReturn<GetDnsRecordListResponse, GetDnsRecordListRequest>} 返回解析记录列表数据
 */
export const getDnsRecordList = (params: GetDnsRecordListRequest) =>
  useApi<ApiResponse<GetDnsRecordListResponse>, GetDnsRecordListRequest>(
    "/v1/dns/record/list",
    params,
  );

/**
 * @description 创建解析记录
 * @description 为指定域名创建新的DNS解析记录
 * @param {CreateDnsRecordRequest} params 创建参数，包含域名ID、记录类型、值等信息
 * @returns {useAxiosReturn<ApiResponse<null>, CreateDnsRecordRequest>} 返回创建操作结果
 */
export const createDnsRecord = (params: CreateDnsRecordRequest) =>
  useApi<ApiResponse<null>, CreateDnsRecordRequest>(
    "/v1/dns/record/create",
    params,
  );

/**
 * @description 删除解析记录
 * @description 删除指定的DNS解析记录
 * @param {DeleteDnsRecordRequest} params 删除参数，包含记录ID和域名ID
 * @returns {useAxiosReturn<ApiResponse<null>, DeleteDnsRecordRequest>} 返回删除操作结果
 */
export const deleteDnsRecord = (params: DeleteDnsRecordRequest) =>
  useApi<ApiResponse<null>, DeleteDnsRecordRequest>(
    "/v1/dns/record/delete",
    params,
  );

/**
 * @description 更新解析记录
 * @description 更新指定的DNS解析记录信息
 * @param {UpdateDnsRecordRequest} params 更新参数，包含记录ID、域名ID和需要更新的字段
 * @returns {useAxiosReturn<ApiResponse<null>, UpdateDnsRecordRequest>} 返回更新操作结果
 */
export const updateDnsRecord = (params: UpdateDnsRecordRequest) =>
  useApi<ApiResponse<null>, UpdateDnsRecordRequest>(
    "/v1/dns/record/update",
    params,
  );

/**
 * @description 暂停解析记录
 * @description 暂停指定的DNS解析记录
 * @param {ToggleDnsRecordRequest} params 暂停参数，包含记录ID和域名ID
 * @returns {useAxiosReturn<ApiResponse<null>, ToggleDnsRecordRequest>} 返回暂停操作结果
 */
export const pauseDnsRecord = (params: ToggleDnsRecordRequest) =>
  useApi<ApiResponse<null>, ToggleDnsRecordRequest>(
    "/v1/dns/record/pause",
    params,
  );

/**
 * @description 启用解析记录
 * @description 启用指定的DNS解析记录
 * @param {ToggleDnsRecordRequest} params 启用参数，包含记录ID和域名ID
 * @returns {useAxiosReturn<ApiResponse<null>, ToggleDnsRecordRequest>} 返回启用操作结果
 */
export const startDnsRecord = (params: ToggleDnsRecordRequest) =>
  useApi<ApiResponse<null>, ToggleDnsRecordRequest>(
    "/v1/dns/record/start",
    params,
  );
