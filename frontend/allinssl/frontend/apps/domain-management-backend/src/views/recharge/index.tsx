import { defineComponent, onMounted } from "vue";
import AccountSummary from "./components/AccountSummary";
import BillTable from "./components/BillTable";
import RechargeRecordsTable from "./components/RechargeRecordsTable";
import { useRechargeController } from "./useController";
import { NCard, NSkeleton } from "naive-ui";

export default defineComponent({
  name: "RechargeManage",
  setup() {
    const { state, loadAll } = useRechargeController();
    onMounted(() => loadAll());

    return () => (
			<div>
				<NCard title="充值管理">
					{state.loading.value ? (
						<NSkeleton text repeat={4} />
					) : (
						<>
							<AccountSummary />
							<NCard title="账单列表" class="my-4">
								<BillTable />
							</NCard>
							<NCard title="充值记录">
								<RechargeRecordsTable />
							</NCard>
						</>
					)}
				</NCard>
			</div>
		)
  },
}); 