import { http, HttpResponse } from 'msw'
import { db } from '../data/recharge'
import { paginate, sleep, fen, nowSec } from '../utils'

const p = (path: string) => [path, `/proxy/api${path}`] as const

export const rechargeHandlers = [
  // 余额账单
  ...p('/credit_sys/credit/get_credit_change_logs').map((path) =>
    http.post(path, async ({ request }) => {
      const body = (await request.json()) as { page: number; pageSize: number }
      const { slice, total } = paginate(db.payChanges.sort((a, b) => b.create_time - a.create_time), body.page, body.pageSize)
      await sleep(300)
      return HttpResponse.json({ success: true, res: { list: slice, total } })
    }),
  ),

  // 充值记录 + 可开票金额
  ...p('/credit_sys/credit/get_credit_add_records').map((path) =>
    http.post(path, async ({ request }) => {
      const body = (await request.json()) as { page: number; pageSize: number }
      const { slice, total } = paginate(db.recharges.sort((a, b) => b.pay_time - a.pay_time), body.page, body.pageSize)
      const can_invoice_fee = Math.max(0, Math.floor(db.recharges.filter(r => r.status === 1).reduce((s, r) => s + r.credit, 0) * 0.8))
      await sleep(300)
      return HttpResponse.json({ success: true, res: { list: slice, total, can_invoice_fee } })
    }),
  ),

  // 发起充值
  ...p('/credit_sys/credit/add').map((path) =>
    http.post(path, async ({ request }) => {
      const body = (await request.json()) as { credit: number }
      const priceYuan = (body.credit || 0) / 100
      const ca_id = 'MOCK-' + Math.random().toString(36).slice(2)
      // 默认先插入一条充值记录（待完成）
      db.orders.set(ca_id, { times: 0, price: priceYuan, channel: 1 })
      await sleep(400)
      return HttpResponse.json({
        success: true,
        res: {
          title: '账户充值',
          ca_id,
          wx: 'https://pay.mock/wechat/' + ca_id,
          ali: 'https://pay.mock/alipay/' + ca_id,
          price: priceYuan,
        },
      })
    }),
  ),

  // 轮询支付状态
  ...p('/credit_sys/credit/get_pay_status').map((path) =>
    http.post(path, async ({ request }) => {
      const body = (await request.json()) as { ca_id: string }
      const order = db.orders.get(body.ca_id)
      if (!order) return HttpResponse.json({ success: true, res: {} })
      order.times += 1
      await sleep(500)
      if (order.times >= 3) {
        // 标记成功，写入充值记录与账单
        const creditFen = fen(order.price)
        const now = nowSec()
        db.recharges.unshift({ pay_time: now, credit: creditFen, channel: order.channel, status: 1, invoice_status: 0 })
        db.payChanges.unshift({ create_time: now, credit: creditFen, type: 1, rest_credit: (db.payChanges[0]?.rest_credit || 0) + creditFen, remark: '充值入账' })
        db.orders.delete(body.ca_id)
        return HttpResponse.json({ success: true, res: { channel: order.channel, status: 1 } })
      }
      return HttpResponse.json({ success: true, res: {} })
    }),
  ),
] 