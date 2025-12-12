export interface LegacyResponse<T> {
  success: boolean;
  res: T;
}

// 请求参数
export interface GetCreditChangeLogsRequest {
  page: number;
  pageSize: number;
}

export interface GetCreditAddRecordsRequest {
  page: number;
  pageSize: number;
}

export interface CreateCreditRechargeRequest {
  credit: number; // 分
}

export interface GetPayStatusRequest {
  ca_id: string;
}

// 数据项
export interface CreditChangeLogItem {
  create_time: number | string;
  credit: number; // 分，可正负
  type: number; // 1充值 2退款 3购买 4续费 5管理员操作
  rest_credit: number; // 分
  remark?: string;
}

export interface RechargeRecordItem {
  pay_time: number | string;
  credit: number; // 分
  channel: number; // 1微信 2支付宝 3线下汇款 4管理员操作
  status: number; // 0未完成 1已完成 2已退款
  invoice_status: number; // 0未开发票 1已开发票
}

// 响应数据
export interface GetCreditChangeLogsData {
  list: CreditChangeLogItem[];
  total: number;
}

export interface GetCreditAddRecordsData {
  list: RechargeRecordItem[];
  total: number;
  can_invoice_fee: number; // 分
}

export interface CreateCreditRechargeData {
  title: string;
  ca_id: string;
  wx: string;
  ali: string;
  price: number; // 元
}

export interface GetPayStatusData {
  channel?: number;
  status?: number;
}

// 响应体（LegacyResponse 包裹）
export type GetCreditChangeLogsResponse = LegacyResponse<GetCreditChangeLogsData>;
export type GetCreditAddRecordsResponse = LegacyResponse<GetCreditAddRecordsData>;
export type CreateCreditRechargeResponse = LegacyResponse<CreateCreditRechargeData>;
export type GetPayStatusResponse = LegacyResponse<GetPayStatusData>; 


export type CreditChangeTypeCode = 1 | 2 | 3 | 4 | 5
export const CREDIT_CHANGE_TYPE_TEXT: Record<CreditChangeTypeCode, string> = {
	1: '充值',
	2: '退款',
	3: '购买',
	4: '续费',
	5: '管理员操作',
}

export type ChannelCode = 1 | 2 | 3 | 4
export const CHANNEL_TEXT: Record<ChannelCode, string> = {
	1: '微信',
	2: '支付宝',
	3: '线下汇款',
	4: '管理员操作',
}

export type RechargeStatusCode = 0 | 1 | 2
export const RECHARGE_STATUS_TO_VM: Record<RechargeStatusCode, 'pending' | 'success' | 'failed'> = {
	0: 'pending',
	1: 'success',
	2: 'failed',
}

export type InvoiceStatusCode = 0 | 1
export const toVmInvoiceStatus = (
	channel: ChannelCode,
	invoiceStatus: InvoiceStatusCode,
): 'pending' | 'issued' | 'none' => {
	if (channel === 4) return 'none'
	return invoiceStatus === 1 ? 'issued' : 'pending'
} 