import { nowSec, fen } from '../utils';

export type PayChangeItem = {
  create_time: number;
  credit: number; // 分，可正可负
  type: 1 | 2 | 3 | 4 | 5;
  rest_credit: number; // 分
  remark?: string;
};

export type RechargeItem = {
  pay_time: number;
  credit: number; // 分
  channel: 1 | 2 | 3 | 4;
  status: 0 | 1 | 2;
  invoice_status: 0 | 1;
};

// 内存库
export const db = {
  balanceFen: fen(1580.5),
  payChanges: [] as PayChangeItem[],
  recharges: [] as RechargeItem[],
  orders: new Map<string, { times: number; price: number; channel: 1 | 2 }>(),
};

// 初始化一些记录
(() => {
  const base = nowSec();
  const seed: PayChangeItem[] = [
    { create_time: base - 3600 * 24 * 1, credit: -fen(50), type: 3, rest_credit: fen(1580.5), remark: '注册域名 example.com' },
    { create_time: base - 3600 * 24 * 2, credit: -fen(30), type: 4, rest_credit: fen(1630.5), remark: '续费域名 test.com' },
    { create_time: base - 3600 * 24 * 3, credit: fen(500), type: 1, rest_credit: fen(1660.5), remark: '支付宝充值' },
  ];
  db.payChanges = seed;
  db.recharges = [
    { pay_time: base - 3600 * 24 * 3, credit: fen(500), channel: 2, status: 1, invoice_status: 0 },
    { pay_time: base - 3600 * 24 * 6, credit: fen(1000), channel: 1, status: 1, invoice_status: 1 },
    { pay_time: base - 3600 * 24 * 10, credit: fen(200), channel: 3, status: 2, invoice_status: 0 },
  ];
})(); 