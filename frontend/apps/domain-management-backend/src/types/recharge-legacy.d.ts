export interface PayChangeItem {
  create_time: number | string;
  credit: number; // 分，可正可负
  type: number;
  rest_credit: number; // 分
  remark?: string;
}

export interface RechargeItem {
  pay_time: number | string;
  credit: number; // 分
  channel: number; // 1:微信 2:支付宝 3:线下 4:管理员
  status: number; // 0未完成 1已完成 2已退款
  invoice_status: number; // 0未开发票 1已开发票
}

export interface CreateRechargeRes {
  title: string;
  ca_id: string;
  wx: string;
  ali: string;
  price: number; // 元
}

export interface PayStatusRes {
  channel?: number;
  status?: number;
} 