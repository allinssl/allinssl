import { defineComponent } from "vue";
import { NDataTable, NTag } from "naive-ui";
import { useRechargeState } from "../useStore";

export default defineComponent({
  name: "BillTable",
  setup() {
    const state = useRechargeState();

    const columns = [
      { title: "账单时间", key: "time", width: 180 },
      {
        title: "金额",
        key: "amount",
        width: 120,
        render(row: any) {
          const positive = Number(row.amount) >= 0;
          const text = `${positive ? "+" : "-"}¥${Math.abs(Number(row.amount)).toFixed(2)}`;
          return (
            <NTag type={positive ? "success" : "error"} bordered={false} size="small">
              {text}
            </NTag>
          );
        },
      },
      { title: "类型", key: "type", width: 140 },
      { title: "余额", key: "balance", width: 120, render: (r: any) => `¥${Number(r.balance).toFixed(2)}` },
      { title: "描述", key: "description" },
    ];

    return () => (
        <NDataTable
          columns={columns as any}
          data={state.bills.value}
          pagination={{
            page: state.billPage.value,
            pageSize: state.billPageSize.value,
            itemCount: state.billTotal.value,
            onChange: (p: number) => state.setBillPage(p),
            onUpdatePageSize: (s: number) => state.setBillPage(1, s),
          }}
        />
    );
  },
}); 