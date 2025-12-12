/**
 * 私有CA证书管理相关类型定义
 */

import type { TableResponse } from '@baota/naive-ui/types/table';

// 证书项类型定义
export interface CertItem {
	id: string;
	name: string;
	cn: string;
	san: string;
	usage: number;
	algorithm: string;
	not_before: string;
	not_after: string;
	status: string;
	ca_cn: string;
}

// 表格查询参数
export interface TableQueryParams {
	page: number;
	pageSize: number;
	keyword?: string;
}

// 中间证书类型
export interface IntermediateCa {
	id: number;
	name: string;
	algorithm: string;
	key_length: number;
	root_id: number | null;
}

// 叶子证书表单数据类型
export interface LeafCertFormData {
	ca_id?: string;
	usage: string;
	algorithm: string;
	key_length?: number;
	valid_days: string;
	cn: string;
	san: string;
}

// SAN项类型
export interface SanItem {
	type: 'dns_names' | 'ip_addresses' | 'email_addresses';
	value: string;
}

// SAN类型选项
export interface SanTypeOption {
	label: string;
	value: 'dns_names' | 'ip_addresses' | 'email_addresses';
}

// 用途选项
export interface UsageOption {
	label: string;
	value: string;
}

// 密钥长度选项
export interface KeyLengthOption {
	label: string;
	value: number;
	[key: string]: string | number; // 添加索引签名以兼容SelectOption
}

// 有效期单位
export type ValidityUnit = 'day' | 'year';

// 表格响应类型
export type LeafCertTableResponse = TableResponse<CertItem>;

// 获取叶子证书列表函数类型
export type FetchLeafCertListFunction = (params: import('@/types/ca').GetLeafCertListParams) => Promise<LeafCertTableResponse>;
