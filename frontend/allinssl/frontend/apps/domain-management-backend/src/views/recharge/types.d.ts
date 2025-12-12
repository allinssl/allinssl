import type {
  CreditChangeLogItem,
  RechargeRecordItem,
} from "@/types/recharge.d";

export interface AccountOverview {
  balance?: number;
  invoiceableAmount?: number;
}

// 展示模型（由后端模型映射而来）
export interface BillItem {
  time: string; // 格式化时间
  amount: number; // 元（可为正负）
  type: string; // 文本
  balance: number; // 元
  description?: string;
  // 源数据（可选调试）
  _raw?: CreditChangeLogItem;
}

export interface RechargeRecord {
  time: string;
  amount: number; // 元
  channel: string; // 文本
  status: 'pending' | 'success' | 'failed';
  invoiceStatus: 'pending' | 'issued' | 'none';
  _raw?: RechargeRecordItem;
}

export interface CreateRechargePayload {
  amount: number; // 元
  channel: 'wechat' | 'alipay';
  amountType?: 'preset' | 'custom'; // 金额类型：预设或自定义
  customAmount?: number; // 自定义金额
}

export interface RechargeState {
  loading: boolean;
  overview: AccountOverview | null;
  bills: BillItem[];
  billTotal: number;
  billPage: number;
  billPageSize: number;
  recharges: RechargeRecord[];
  rechargeTotal: number;
  rechargePage: number;
  rechargePageSize: number;
  modalVisible: boolean;
  createPayload: CreateRechargePayload;
  pollingOrderId?: string | number;
} 