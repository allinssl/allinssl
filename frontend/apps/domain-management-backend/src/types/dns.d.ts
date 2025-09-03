import { DnsRecordItem } from './domain';
/**
 * 线路信息
 */
export interface DnsView {
  /** 子线路列表 */
  children: DnsView[];
  /** 是否为默认线路 */
  default: boolean;
  /** 是否免费使用 */
  free: boolean;
  /** 线路名称 */
  name: string;
  /** 排序顺序 */
  sort: number;
  /** 线路ID */
  viewId: number;
}

/**
 * 获取线路列表响应
 */
export interface GetViewsResponse {
  /** 状态码 */
  code: number;
  /** 线路列表 */
  data: DnsView[];
  /** 响应消息 */
  msg: string;
  /** 请求状态 */
  status: boolean;
}

/**
 * 解析记录类型
 */
export interface DnsRecordType {
  /** 记录类型 */
  type: string;
  /** 是否为默认类型 */
  default: boolean;
  /** 类型描述 */
  desc: string;
}

/**
 * 获取解析记录类型列表响应
 */
export interface GetRecordTypeListResponse {
  /** 记录类型列表 */
  data: DnsRecordType[];
}

/**
 * 解析记录
 */
export interface DnsRecord {
  /** 记录ID */
  record_id: number | string;
  /** 域名ID */
  domain_id: number;
  /** 主机记录 */
  record: string;
  /** 记录类型 */
  type: string;
  /** 记录值 */
  value: string;
  /** TTL值 */
  TTL: number;
  /** MX优先级 */
  MX: number;
  /** 记录状态 (0-启用, 1-暂停) */
  state: number;
  /** 备注 */
  remark: string;
  /** 线路ID */
  viewID: number;
}

/**
 * 获取解析记录列表请求参数
 */
export interface GetDnsRecordListRequest {
  /** 域名ID */
  domain_id: number;
  /** 搜索关键字字段 */
  searchKey?: string;
  /** 搜索值 */
  searchValue?: string;
  /** 页码 */
  p?: number;
  /** 每页条数 */
  row?: number;
}

/**
 * 获取解析记录列表响应
 */
export interface GetDnsRecordListResponse {
  /** 总记录数 */
  count: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  row: number;
  /** 记录列表 */
  data: DnsRecordItem[];
}

/**
 * 创建解析记录请求参数
 */
export interface CreateDnsRecordRequest {
  /** 域名ID */
  domain_id: number;
  /** 解析值 */
  value: string;
  /** 主机记录 */
  record: string;
  /** 记录类型 */
  type: string;
  /** MX优先级 */
  mx: number;
  /** 生存时间 */
  ttl: number;
  /** 备注信息 */
  remark: string;
  /** 线路ID */
  viewId: number;
}

/**
 * 删除解析记录请求参数
 */
export interface DeleteDnsRecordRequest {
  /** 记录ID */
  record_id: number | string;
  /** 域名ID */
  domain_id: number;
}

/**
 * 更新解析记录请求参数
 */
export interface UpdateDnsRecordRequest {
  /** 记录ID */
  record_id: number | string;
  /** 域名ID */
  domain_id: number;
  /** 主机记录 */
  record?: string;
  /** 解析值 */
  value?: string;
  /** 记录类型 */
  type?: string;
  /** MX优先级 */
  mx?: number;
  /** 生存时间 */
  ttl?: number;
  /** 备注信息 */
  remark?: string;
  /** 线路ID */
  viewId?: number;
}

/**
 * 暂停/启用解析记录请求参数
 */
export interface ToggleDnsRecordRequest {
  /** 记录ID */
  record_id: number | string;
  /** 域名ID */
  domain_id: number;
}
