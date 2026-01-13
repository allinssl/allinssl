import { defineComponent } from "vue";
import { NDataTable, NTag } from "naive-ui";
import { useRechargeState } from "../useStore";

export default defineComponent({
  name: "RechargeRecordsTable",
  setup() {
    const state = useRechargeState();

    const columns = [
      { title: "充值时间", key: "time", width: 180 },
      { title: "金额", key: "amount", width: 120, render: (r: any) => `¥${Number(r.amount).toFixed(2)}` },
      { title: "渠道", key: "channel", width: 120 },
      {
        title: "交易状态",
        key: "status",
        width: 120,
        render: (r: any) => (
          <NTag type={r.status === 'success' ? 'success' : r.status === 'pending' ? 'warning' : 'error'} size="small" bordered={false}>
            {r.status === 'success' ? '成功' : r.status === 'pending' ? '待支付' : '失败'}
          </NTag>
        ),
      },
      {
        title: "发票状态",
        key: "invoiceStatus",
        width: 120,
        render: (r: any) => (
          <NTag type={r.invoiceStatus === 'issued' ? 'success' : r.invoiceStatus === 'pending' ? 'warning' : 'default'} size="small" bordered={false}>
            {r.invoiceStatus === 'issued' ? '已开票' : r.invoiceStatus === 'pending' ? '待开票' : '无需开票'}
          </NTag>
        ),
      },
    ];

    return () => (
        <NDataTable
          columns={columns as any}
          data={state.recharges.value}
          pagination={{
            page: state.rechargePage.value,
            pageSize: state.rechargePageSize.value,
            itemCount: state.rechargeTotal.value,
            onChange: (p: number) => state.setRechargePage(p),
            onUpdatePageSize: (s: number) => state.setRechargePage(1, s),
          }}
        />
    );
  },
}); 